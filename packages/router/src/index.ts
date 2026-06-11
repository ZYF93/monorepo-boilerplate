import { exactRegex } from "@rolldown/pluginutils";
import chokidar from "chokidar";
import { globSync } from "glob";
import { join } from "path";
import type { RouteObject } from "react-router";
import type { Plugin } from "vite-plus";

import type { Menu, Meta } from "./type";

export default function myPlugin(): Plugin {
  const virtualModuleId = "virtual:bc-router";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  const PAGES_DIR = join(process.cwd(), "src/pages");
  let rootMenu: Menu;

  const removePrefix = (str: string) => str.replace(process.cwd(), "").replace(/\\/g, "/");
  const getPath = (str: string) =>
    str
      .replace(/.*\/pages\/?/, "/")
      .replace(/\[([^\]]+)\]/, ":$1")
      .replace(/<([^>]+)>/, "$1") || "/";
  const removeGroup = (str: string) => str.replace(/\([^)]+\)\/?/g, "");

  return {
    name: "vite-plugin-react-bc-router",
    resolveId: {
      filter: { id: exactRegex(virtualModuleId) },
      handler() {
        return resolvedVirtualModuleId;
      },
    },
    load: {
      filter: { id: exactRegex(resolvedVirtualModuleId) },
      async handler() {
        const pages = (globSync(join(PAGES_DIR, "**/index.tsx")) || []).reduce(
          (obj, p) => ({
            ...obj,
            [removePrefix(p)]: true,
          }),
          {} as Record<string, boolean>,
        );
        const layouts = (globSync(join(PAGES_DIR, "**/layout.tsx")) || []).reduce(
          (obj, p) => ({
            ...obj,
            [removePrefix(p)]:
              `{{ {Component: () => import("${removePrefix(p)}").then(mod => mod.Layout).catch(() => Promise.resolve(DefaultLayout))} }}`,
          }),
          {} as Record<string, string>,
        );
        const metas: Record<string, Meta & { $k: string; $i: string }> = await (
          globSync(join(PAGES_DIR, "**/meta.ts")) || []
        ).reduce(
          async (obj, p, i) => {
            return {
              ...(await obj),
              [removePrefix(p)]: {
                ...(await import(`file://${p}?t=${Date.now()}`)), // TODO: 用自定义的文字解析代替 import 以保证不会导入意外的文件
                $k: `meta${i}`,
                $i: `import * as meta${i} from "${removePrefix(p)}";`,
              },
            };
          },
          Promise.resolve({} as Record<string, Meta & { $k: string; $i: string }>),
        );
        const metaImport = Object.keys(metas)
          .map((p) => metas[p].$i)
          .join("\n");
        const menuObj: Record<string, Menu> = {};
        type StringRO = Omit<RouteObject, "lazy" | "loader" | "children"> & {
          lazy?: string;
          loader?: string;
          children?: StringRO[];
          _filePath: string;
        };
        const routeObj: Record<string, StringRO> = {};
        const filePaths = new Set(
          Object.keys({ ...pages, ...layouts }).map((p) => p.replace(/\/(index|layout)\.tsx$/, "")),
        );
        filePaths.forEach((filePath) => {
          const path = getPath(filePath);
          const meta = metas[join(filePath, "meta.ts")] || {};
          const layout =
            layouts[join(filePath, "layout.tsx")] ||
            `{{ {Component: () => Promise.resolve(DefaultLayout)} }}`;
          const pageKey = join(filePath, "index.tsx");
          const hasPage = pages[pageKey];
          const page = `{{ {Component: () => ${hasPage ? `import("${pageKey}").then(mod => mod.Page)` : "Promise.resolve(NavTo404)"}} }}`;
          const isAction = /<[^>]+>\/?$/.test(filePath);
          const isGroup = /\([^>]+\)\/?$/.test(filePath);
          routeObj[path] = {
            path: isGroup ? undefined : path,
            lazy: layout,
            handle: { isAction, path },
            _filePath: filePath,
            children: isGroup
              ? []
              : [
                  {
                    _filePath: filePath,
                    handle: { isAction, path },
                    path,
                    lazy: page,
                    loader: hasPage
                      ? `
{{ async ({ params, request }) => {
   const url = new URL(request.url);
   const req = {
      params,
      query: Object.fromEntries(url.searchParams),
      pathname: url.pathname.replace(/\\/?$/, "/"),
    };
    ${
      meta?.skipAuth
        ? ""
        : `
if (!(await system.checkAuth().catch(e => { console.error(e); return false; }))) return redirect(\`/login?from=\${encodeURIComponent(request.url)}\`);
`
    }
    ${
      meta?.skipPermission
        ? ""
        : `
if (!(await system.checkPermission("${
            meta.permission ??
            removeGroup(path).replace(/^\//, "").replace(/:/g, "_").replace(/\//g, ":")
          }").catch(e => { console.error(e); return false; }))) return ${isAction ? `redirect(window.location.pathname == "${path}" || window.location.pathname == "${path}/" ? "/403" : window.location.href)` : 'redirect("/403")'};
`
    }
    ${meta.name ? `document.title = ${meta.$k}.name` : "document.title = defaultTitle"};
    return ${meta?.loader ? `${meta.$k}.loader(req)` : ""};
 } }}`.replace(/\n|\\n|\s\s+/g, "")
                      : undefined,
                  },
                ],
          };
          menuObj[path] = {
            path,
            name: meta.name ?? removeGroup(path),
            icon: meta.icon,
            display: meta.displayInMenu ?? false,
            permission: meta.skipPermission
              ? undefined
              : (meta.permission ?? removeGroup(path).replace(/:/g, "_").replace(/\//g, ":")),
          };
        });

        filePaths.forEach((filePath) => {
          const path = getPath(filePath);
          if (path === "/") return;
          const curRoute = routeObj[path];
          const curMenu = menuObj[path];
          const segments = path.split("/").filter(Boolean);
          const paths = ["/"];
          let finished1 = false;
          let finished2 = !curMenu;
          segments.reduce((acc, curr) => {
            const newPath = acc + "/" + curr;
            if (newPath !== path) paths.unshift(newPath);
            return newPath;
          }, "");
          for (const p of paths) {
            if (!finished1 && routeObj[p]) {
              const pageKey = join(routeObj[p]._filePath, "index.tsx");
              if (curRoute.handle.isAction) {
                routeObj[p].children![0].lazy =
                  `{{ {Component: () => import("${pageKey}").then(mod => withOutlet(mod.Page, "${p}")).catch(() => Promise.resolve(NavTo404))} }}`;
                routeObj[p].children![0].children ??= [];
                routeObj[p].children![0].children.push(curRoute);
              } else {
                routeObj[p].children!.push(curRoute);
              }
              finished1 = true;
            }
            if (!finished2 && menuObj[p]) {
              menuObj[p].children ??= [];
              menuObj[p].children.push(curMenu);
              finished2 = true;
            }
            if (finished1 && finished2) break;
          }
        });

        rootMenu = menuObj["/"];

        let last = rootMenu;
        const arr = [last];
        while (arr.length) {
          const cur = arr.shift();
          if (!cur) break;
          const isGroup = /\([^>]+\)\/?$/.test(cur.path);
          if (!isGroup) {
            cur.path = removeGroup(cur.path);
            last = cur;
          } else {
            last.children ??= [];
            last.children = [...last.children, ...(cur.children ?? [])].filter(
              (item) => item !== cur,
            );
          }
          arr.push(...(cur.children ?? []));
        }

        for (const arr = [routeObj["/"]]; arr.length > 0; ) {
          const cur = arr.shift();
          if (!cur) break;
          cur.path = removeGroup(cur?.path || "") || undefined;
          cur.handle.path = removeGroup(cur?.handle?.path || "") || undefined;
          arr.push(...(cur?.children ?? []));
        }

        const vfile = `
import React from "react";
import { DefaultLayout, ProgressLayout, system, ErrorBoundary, withOutlet, NavTo404 } from "@bc/router/components";
import { Navigate, redirect } from "react-router";
${metaImport}
const defaultTitle = document.title;
window.onerror = function (message, source, lineno, colno, error) {
  system.reportError(error)
};
window.addEventListener("unhandledrejection", function (event) {
  system.reportError(event.reason)
});
export const routes = [{
  path: "/",
  Component: ProgressLayout,
  ErrorBoundary,
  HydrateFallback: system.sys?.LoadingComponent,
  children: [${JSON.stringify(routeObj["/"])}]
}, {
  path: "*",
  Component: NavTo404,
}];
export const menu = ${JSON.stringify(menuObj["/"])};`
          .replace(/"\{\{(.*?)\}\}"/g, "$1")
          .replace(/\\"/g, '"')
          .replace(/\\+/g, "\\");

        return vfile;
      },
    },
    configureServer(server) {
      const watcher = chokidar.watch(PAGES_DIR, {
        ignoreInitial: true,
        depth: 99,
      });

      // 文件新增、删除、修改 → 触发热更新
      watcher.on("all", (type, file) => {
        if (type === "add" || type === "unlink" || type === "change") {
          // 只监听路由文件
          if (/(index|layout|meta)\.tsx?$/.test(file)) {
            const module = server.moduleGraph.getModuleById("\0virtual:bc-router");
            const changedFile = server.moduleGraph.getModulesByFile(file);
            if (changedFile) {
              changedFile.forEach((f) => server.reloadModule(f));
            }
            if (module) {
              server.reloadModule(module).catch((e) => console.error(e));
            }
          }
        }
      });
    },
    generateBundle() {
      if (!rootMenu) return;
      const source = JSON.stringify(rootMenu, null, 2);
      this.emitFile({
        source,
        type: "asset",
        fileName: "root.json",
      });
    },
  };
}
