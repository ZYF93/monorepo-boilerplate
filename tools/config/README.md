# @bc/config

共享工具链配置包。这里集中维护 Vite+、TypeScript、打包、测试和公共样式入口配置，不承载具体业务配置。

## 导出内容

- `@bc/config/vite.react`：React 应用使用的 Vite+ 配置，包含基础测试配置、路径解析、Tailwind、React 插件和装饰器编译配置。
- `@bc/config/vite.pack`：组件库和工具包使用的打包配置，包含 CSS 注入、PostCSS、React 插件、声明文件生成和依赖外置规则。
- `@bc/config/tsconfig.app.json`：React 应用使用的 TypeScript 配置。
- `@bc/config/tsconfig.pack.json`：库包使用的 TypeScript 配置。
- `@bc/config/theme.css`：公共 Tailwind 样式入口。

## 使用方式

应用包通常在 `vite.config.ts` 中继承 `vite.react`，再合并本应用自己的插件：

```ts
import config from "@bc/config/vite.react";
import { defineConfig, mergeConfig } from "vite-plus";

export default mergeConfig(
  config,
  defineConfig({
    plugins: [],
  }),
);
```

库包通常直接使用或合并 `vite.pack`：

```ts
export { default } from "@bc/config/vite.pack";
```

TypeScript 配置通过 `extends` 继承：

```json
{
  "extends": "@bc/config/tsconfig.pack.json"
}
```

组件库或应用需要公共 Tailwind 样式时，从入口文件导入：

```ts
import "@bc/config/theme.css";
```

## 维护约定

- 只放跨包共享的工具链配置，不放单个包的临时配置。
- 修改共享配置前先确认影响范围；`vite.base.ts` 会影响测试，`vite.react.ts` 会影响应用开发构建，`vite.pack.ts` 会影响库包产物。
- 不为单个包的特殊场景扩大共享配置；优先在消费包本地 `mergeConfig`。
- 调整 `deps.neverBundle` 时要确认包的 peer/dependency 边界，避免把运行时依赖错误打进产物。
- 调整 `tsconfig` 时要同时考虑应用包和库包的类型检查行为，不要只以一个包通过为准。
- 公共样式入口只能放跨项目基础样式；组件私有样式仍应跟随组件维护。

## 测试标准

`@bc/config` 当前没有独立的 package scripts，变更需要通过消费包验证。

- 修改 `vite.base.ts` 后，至少运行受影响包的测试；涉及 Storybook 或 e2e project 时运行仓库测试：

```bash
vp run -r test
```

- 修改 `vite.react.ts` 后，至少验证一个应用包的构建：

```bash
vp run -F bc-app build
```

- 修改 `vite.pack.ts`、`postcss.config.ts` 或 `theme.css` 后，至少验证一个库包的测试和构建：

```bash
vp run @bc/components#test
vp run @bc/components#build
```

- 修改 `tsconfig.*.json` 后，在仓库根目录运行类型检查覆盖受影响包：

```bash
vp check
```

跨多个配置文件的改动，使用仓库级验证：

```bash
vp run ready
```

## 提交前检查

提交涉及本包的改动前，按影响范围选择上面的验证命令。无法判断影响范围时直接运行：

```bash
vp run ready
```
