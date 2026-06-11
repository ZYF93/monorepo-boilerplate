# @bc/create

BC monorepo 的 Vite+ 本地脚手架。

## 用法

```bash
vp create @bc/create -- app apps/admin
vp create @bc/create -- package packages/shared
```

也可以省略父目录，脚手架会按模板自动补齐：

```bash
vp create @bc/create -- app admin
vp create @bc/create -- package shared
```

当前仓库根配置已将 `create.defaultTemplate` 指向 `@bc/create`，因此也可以直接运行：

```bash
vp create
```

## 模板

- `app`：复用 `@bc/config/vite.react`、`@bc/router`、`@bc/env` 的 React 应用模板。
- `package`：复用 `@bc/config/vite.pack` 的 TypeScript 包模板。

`package.json` 里的依赖会按当前仓库约定使用 `workspace:*` 和 `catalog:`。
