# BC 前端 Monorepo

这是基于 Vite+ 的 BC 前端 monorepo，统一管理应用、通用包、工具链配置和本地脚手架。仓库使用 `vp` 作为主要命令入口，包管理由 pnpm workspace 和 catalog 版本约束提供。

## 基本规则

- 使用 `vp install` 安装依赖；拉取远端变更后先执行一次，确保 Vite+、workspace 依赖和构建产物同步。
- 应用放在 `apps/*`，可发布或复用的运行时包放在 `packages/*`，工具链和脚手架放在 `tools/*`。
- 跨包依赖优先使用 `workspace:*`，三方依赖版本优先放在 `pnpm-workspace.yaml` 的 `catalog` 中统一维护。
- 共享配置从 `@bc/config` 引入；单个包的特殊配置在本包内 `mergeConfig`，不要把局部需求扩大到共享配置。
- React 应用页面放在 `src/pages`，路由由 `@bc/router` 按文件生成；可复用 UI 放到 `@bc/components`，通用逻辑放到对应工具包。
- 对外导出的库包 API 从明确入口暴露，避免让使用方依赖内部文件路径。
- 修改代码后按影响范围运行测试和构建；不确定影响范围时执行 `vp run ready`。

## 包概览

| 路径                    | 包名               | 职责                                                                               |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `apps/bc-app`           | `bc-app`           | 示例 React 应用，集成共享 Vite 配置、环境变量插件和文件路由。                      |
| `packages/components`   | `@bc/components`   | 跨应用复用的 React 组件库，配套 Storybook 和浏览器测试约定。                       |
| `packages/http-request` | `@bc/http-request` | 基于 axios 的请求核心包，提供实例工厂、响应解包、错误归一、重试和 token 刷新队列。 |
| `packages/router`       | `@bc/router`       | Vite+ 文件路由插件和路由运行时基础组件，生成 `virtual:bc-router` 与菜单树。        |
| `packages/shared-utils` | `@bc/shared-utils` | 公共工具函数，按 browser、json、option、validator 等子路径导出。                   |
| `tools/config`          | `@bc/config`       | 共享 Vite+、TypeScript、打包、测试和公共样式配置。                                 |
| `tools/create`          | `@bc/create`       | 本地脚手架，提供应用和 TypeScript 包模板。                                         |
| `tools/env`             | `@bc/env`          | 共享环境变量注入插件，合并包内默认 env 和应用 env。                                |

各包的接入方式、开发约定和测试标准见对应目录下的 `README.md`。

## 常用命令

仓库根目录执行：

```bash
vp install
vp run ready
```

开发、测试和构建：

```bash
vp run dev
vp check
vp run -r test
vp run -r build
```

运行单个包任务：

```bash
vp run bc-app#dev
vp run @bc/router#test
vp run @bc/components#storybook
```

创建新应用或包：

```bash
vp create @bc/create -- app apps/admin
vp create @bc/create -- package packages/shared
```

当前根配置已将默认模板指向 `@bc/create`，也可以直接运行 `vp create` 按提示创建。
