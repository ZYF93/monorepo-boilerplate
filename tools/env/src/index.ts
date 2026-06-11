import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Plugin } from "vite-plus";
import { loadEnv } from "vite-plus";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function getEnvFiles(mode: string, envDir: string): string[] {
  return [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`].map((file) =>
    path.join(envDir, file),
  );
}

function getEnvKeys(mode: string, envDir: string): string[] {
  const keys = new Set<string>();

  for (const file of getEnvFiles(mode, envDir)) {
    if (!fs.existsSync(file)) continue;

    for (const line of fs.readFileSync(file, "utf-8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=/);
      if (match) keys.add(match[1]);
    }
  }

  return [...keys];
}

function loadExactEnv(mode: string, envDir: string | false): Record<string, string> {
  if (envDir === false) return {};

  const keys = getEnvKeys(mode, envDir);
  if (keys.length === 0) return {};

  const keySet = new Set(keys);
  return Object.fromEntries(
    Object.entries(loadEnv(mode, envDir, keys)).filter(([key]) => keySet.has(key)),
  );
}

function loadPackageEnv(mode: string): Record<string, string> {
  return loadExactEnv(mode, packageRoot);
}

function mergeProcessEnv(env: Record<string, string>): Record<string, string> {
  const merged: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] !== undefined) continue;

    process.env[key] = value;
    merged[key] = value;
  }

  return merged;
}

function loadUserEnv(
  mode: string,
  envDir: string | false,
  processDefaults: Record<string, string>,
): Record<string, string> {
  const restored: Record<string, string> = {};

  for (const [key, value] of Object.entries(processDefaults)) {
    if (process.env[key] !== value) continue;

    delete process.env[key];
    restored[key] = value;
  }

  try {
    return loadExactEnv(mode, envDir);
  } finally {
    Object.assign(process.env, restored);
  }
}

function getRestartWatchEntries(mode: string, envDir: string | false): string[] {
  const dirs = envDir === false ? [packageRoot] : [packageRoot, envDir];
  return [...new Set([...dirs, ...dirs.flatMap((dir) => getEnvFiles(mode, dir))])];
}

function getRestartEnvFileSet(mode: string, envDir: string | false): Set<string> {
  const dirs = envDir === false ? [packageRoot] : [packageRoot, envDir];
  return new Set(dirs.flatMap((dir) => getEnvFiles(mode, dir)).map((file) => path.resolve(file)));
}

export default function myPlugin(): Plugin {
  const processDefaults: Record<string, string> = {};

  return {
    name: "vite-plugin-bc-env",
    enforce: "pre",
    config() {
      Object.assign(
        processDefaults,
        mergeProcessEnv(loadPackageEnv(process.env.NODE_ENV || "development")),
      );
    },
    configResolved(config) {
      const packageEnv = loadPackageEnv(config.mode);
      const userEnv = loadUserEnv(config.mode, config.envDir, processDefaults);
      const resolvedEnv = { ...config.env };

      for (const [key, value] of Object.entries(processDefaults)) {
        if (resolvedEnv[key] === value) delete resolvedEnv[key];
      }

      Object.assign(config.env, packageEnv, userEnv, resolvedEnv);
    },
    configureServer(server) {
      const restartEnvFileSet = getRestartEnvFileSet(server.config.mode, server.config.envDir);
      let restartTimer: ReturnType<typeof setTimeout> | undefined;

      const restart = (file: string) => {
        clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          server.config.logger.info(
            `${path.relative(process.cwd(), file)} changed, restarting server...`,
            {
              clear: true,
              timestamp: true,
            },
          );
          void server.restart().catch((error: unknown) => {
            server.config.logger.error(String(error));
          });
        }, 50);
      };

      const onEnvChange = (type: string, file: string) => {
        if (type !== "add" && type !== "change" && type !== "unlink") return;
        if (!restartEnvFileSet.has(path.resolve(file))) return;

        restart(file);
      };

      server.watcher.add(getRestartWatchEntries(server.config.mode, server.config.envDir));
      server.watcher.on("all", onEnvChange);

      return () => {
        clearTimeout(restartTimer);
        server.watcher.off("all", onEnvChange);
      };
    },
  };
}
