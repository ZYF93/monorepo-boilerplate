#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const templatesRoot = path.join(packageRoot, "templates");

const templates = {
  app: {
    defaultParent: "apps",
    description: "BC React 应用",
    packageNamePrefix: "",
  },
  package: {
    defaultParent: "packages",
    description: "BC TypeScript 包",
    packageNamePrefix: "@bc/",
  },
};

const args = process.argv.slice(2);

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  const [rawTemplate, rawTarget, rawPackageName] = args.filter((arg) => !arg.startsWith("--"));
  const templateName = rawTemplate ?? (interactive ? await selectTemplate() : "app");
  assertTemplateName(templateName);

  const targetDir = normalizeTargetDir(
    templateName,
    rawTarget ??
      (interactive ? await askTargetDir(templateName) : getDefaultTargetDir(templateName)),
  );
  assertTargetDir(targetDir);

  const packageName = rawPackageName ?? derivePackageName(templateName, targetDir);
  assertPackageName(packageName);

  const rootDir = findWorkspaceRoot(process.cwd());
  const fullTargetDir = path.resolve(rootDir, targetDir);
  assertInsideRoot(rootDir, fullTargetDir);
  assertTargetAvailable(fullTargetDir);

  copyDir(path.join(templatesRoot, templateName), fullTargetDir);
  renameScaffoldFiles(fullTargetDir);
  updatePackageJson(path.join(fullTargetDir, "package.json"), (pkg) => ({
    ...pkg,
    name: packageName,
  }));

  console.log(
    `已创建 ${templates[templateName].description}: ${path.relative(rootDir, fullTargetDir)}`,
  );
}

function printHelp() {
  console.log(`Usage:
  vp create @bc/create -- app apps/admin [package-name]
  vp create @bc/create -- package packages/shared [package-name]

Arguments:
  template      app | package
  targetDir     目标目录，相对 monorepo 根目录
  packageName   可选，默认根据目录名推导
`);
}

async function selectTemplate() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("请选择模板（app/package，默认 app）：");
    return answer.trim() || "app";
  } finally {
    rl.close();
  }
}

async function askTargetDir(templateName) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const defaultDir = getDefaultTargetDir(templateName);
    const answer = await rl.question(`目标目录（默认 ${defaultDir}）：`);
    return answer.trim() || defaultDir;
  } finally {
    rl.close();
  }
}

function getDefaultTargetDir(templateName) {
  return path.posix.join(
    templates[templateName].defaultParent,
    templateName === "app" ? "new-app" : "new-package",
  );
}

function assertTemplateName(templateName) {
  if (templateName in templates) return;
  throw new Error(`未知模板：${templateName}，可选值为 app、package`);
}

function assertTargetDir(targetDir) {
  if (!targetDir || targetDir === ".") throw new Error("目标目录不能为空");
  if (path.isAbsolute(targetDir)) throw new Error("目标目录必须是相对路径");
  if (targetDir.split(/[\\/]+/).includes("..")) throw new Error("目标目录不能包含 ..");
}

function normalizeTargetDir(templateName, targetDir) {
  const normalized = targetDir.replace(/\\/g, "/").replace(/\/+$/, "");
  if (normalized.includes("/")) return normalized;
  return path.posix.join(templates[templateName].defaultParent, normalized);
}

function assertPackageName(packageName) {
  if (/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(packageName)) return;
  throw new Error(`非法 package name：${packageName}`);
}

function assertInsideRoot(rootDir, targetDir) {
  const relative = path.relative(rootDir, targetDir);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) return;
  throw new Error("目标目录必须位于当前 monorepo 内");
}

function assertTargetAvailable(targetDir) {
  if (!fs.existsSync(targetDir)) return;
  const entries = fs.readdirSync(targetDir).filter((entry) => entry !== ".git");
  if (entries.length === 0) return;
  throw new Error(`目标目录已存在且非空：${targetDir}`);
}

function derivePackageName(templateName, targetDir) {
  const baseName = path.basename(targetDir);
  return `${templates[templateName].packageNamePrefix}${baseName}`;
}

function findWorkspaceRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
      continue;
    }
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function renameScaffoldFiles(targetDir) {
  const renameMap = {
    _gitignore: ".gitignore",
  };
  for (const [from, to] of Object.entries(renameMap)) {
    const fromPath = path.join(targetDir, from);
    if (fs.existsSync(fromPath)) fs.renameSync(fromPath, path.join(targetDir, to));
  }
}

function updatePackageJson(packageJsonPath, updater) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(updater(pkg), null, 2)}\n`);
}
