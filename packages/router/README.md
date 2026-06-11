# @bc/router

文件路由插件和路由基础组件包。这里记录脚手架阶段的路由约定、接入方式和测试标准，不描述具体业务页面。

## 常用命令

在仓库根目录执行：

```bash
vp install
vp run @bc/router#test
vp run @bc/router#build
```

也可以进入 `packages/router` 后执行：

```bash
vp run test
vp run build
vp run dev
```

仓库级验证使用：

```bash
vp check
vp run -r test
vp run -r build
```

## 使用方式

在应用的 `vite.config.ts` 中引入插件：

```ts
import config from "@bc/config/vite.react";
import router from "@bc/router";
import { defineConfig, mergeConfig } from "vite-plus";

export default mergeConfig(
  config,
  defineConfig({
    plugins: [router()],
  }),
);
```

在应用入口中从虚拟模块读取路由和菜单：

```ts
import { menu, routes } from "virtual:bc-router";
```

如果 TypeScript 无法识别虚拟模块，在应用声明文件中引入类型：

```ts
/// <reference types="@bc/router/env" />
```

路由运行时依赖 `@bc/router/components` 提供的基础组件和 `system`。应用需要注入 `Sys` 实现，用于登录检查、权限检查、错误上报和加载组件。

## 文件路由规则

插件会扫描当前应用的 `src/pages` 目录。

- `index.tsx`：页面文件，必须导出 `Page`。
- `layout.tsx`：布局文件，必须导出 `Layout`。
- `meta.ts`：页面元信息文件，按需导出 meta 字段。
- `[id]`：动态路由参数，例如 `src/pages/users/[id]/index.tsx` 会生成 `/users/:id`。
- `(group)`：分组路由目录，不进入最终 URL，例如 `src/pages/(menu)/users/index.tsx` 会生成 `/users`。
- `<edit>`：动作路由片段，会生成普通路径 `edit`，并在路由 `handle.isAction` 中标记为动作路由。
- 没有页面文件的路由会使用 `NavTo404`，没有布局文件的路由会使用默认布局。

页面示例：

```tsx
import type { FC } from "react";

export const Page: FC = () => {
  return <div>页面内容</div>;
};
```

布局示例：

```tsx
import type { FC, PropsWithChildren } from "react";
import { Outlet } from "react-router";

export const Layout: FC<PropsWithChildren> = () => {
  return <Outlet />;
};
```

## 分组路由

用括号包裹的目录会被识别为分组路由。分组目录可以承载 `layout.tsx` 和 `meta.ts`，用于组织页面、菜单和布局，但目录名本身会从最终路由路径与权限 key 中移除。

示例目录：

```text
src/pages
├── (menu)
│   ├── layout.tsx
│   └── users
│       ├── index.tsx
│       └── meta.ts
└── (no-menu)
    └── login
        ├── index.tsx
        └── meta.ts
```

生成结果：

| 文件路径                              | 最终路径 | 默认权限 key |
| ------------------------------------- | -------- | ------------ |
| `src/pages/(menu)/users/index.tsx`    | `/users` | `users`      |
| `src/pages/(no-menu)/login/index.tsx` | `/login` | `login`      |

分组目录适合表达“有菜单布局”和“无菜单布局”这类结构差异。分组名只服务于文件组织，不应该被业务代码当作真实 URL 片段使用。

## meta 规则

`meta.ts` 支持以下导出：

```ts
import type { Loader } from "@bc/router/components";

export const name = "页面标题";
export const icon = "home";
export const displayInMenu = true;
export const skipAuth = false;
export const skipPermission = false;

export const loader: Loader = async ({ params, query, pathname }) => {
  return { params, query, pathname };
};
```

- `name`：用于 `document.title` 和菜单名称。
- `icon`：菜单图标标识。
- `displayInMenu`：是否在菜单中展示，默认 `false`。
- `skipAuth`：是否跳过登录检查，默认不跳过。
- `skipPermission`：是否跳过权限检查，默认不跳过。
- `loader`：React Router loader，接收 `params`、`query` 和标准化后的 `pathname`。
- `permission`: 覆盖路由 permission key

权限 key 由路径生成：去掉开头 `/`，把动态参数中的 `:` 替换为 `_`，再把路径分隔符 `/` 替换为 `:`。例如 `/users/:id` 对应 `users:_id`。

## 产物和虚拟模块

- `virtual:bc-router` 会导出 `routes` 和 `menu`。
- 构建时会额外生成 `root.json`，内容是根菜单树。
- 开发服务中新增、删除或修改 `index.tsx`、`layout.tsx`、`meta.ts` 会触发相关模块热更新。

## 开发约定

- 只把跨应用通用的路由生成逻辑放在本包；单个应用的鉴权、菜单展示和页面布局细节放在应用内。
- 页面、布局和 meta 的导出名称必须稳定，不使用默认导出。
- 新增 meta 字段前要确认它会影响路由生成、菜单生成还是运行时 loader，并补充类型。
- 修改路径解析规则时，要同时考虑动态路由、动作路由、嵌套路由和菜单树。
- 不在插件里读取业务数据或具体权限表；插件只负责生成路由结构和调用注入的系统能力。
- 当前 meta 通过动态 `import` 读取，meta 文件应避免执行有副作用的逻辑。

## 测试标准

router 包测试应覆盖生成结果和运行时行为，不能只测试单个工具函数。

- 覆盖基础页面、嵌套路由、动态路由和动作路由的路径生成。
- 覆盖 `layout.tsx` 存在和缺失时的生成结果。
- 覆盖 `meta.ts` 的 `name`、`icon`、`displayInMenu`、`skipAuth`、`skipPermission`、`loader` 行为。
- 覆盖权限 key 生成规则，特别是动态参数和多级路径。
- 覆盖 `virtual:bc-router` 导出的 `routes`、`menu` 结构。
- 覆盖 `root.json` 生成。
- 覆盖开发模式下路由文件新增、修改、删除会触发模块更新。
- 覆盖 `system.checkAuth`、`system.checkPermission`、`system.reportError` 的调用路径。

测试文件使用 `*.test.ts` 或 `*.test.tsx` 命名。涉及文件扫描时使用临时目录构造最小 `src/pages`，测试结束后清理；涉及页面流程时在应用包补充 e2e 测试。

## 提交前检查

提交涉及本包的改动前至少执行：

```bash
vp run @bc/router#test
vp run @bc/router#build
```

如果修改会影响应用路由生成，再验证使用方：

```bash
vp run bc-app#test
vp run bc-app#build
```

跨包改动或不确定影响范围时执行仓库级验证：

```bash
vp run ready
```
