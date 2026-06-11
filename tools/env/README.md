# @bc/env

环境变量注入插件。这里维护跨应用共享的 Vite+ env 加载逻辑，不记录具体业务环境变量说明。

## 常用命令

在仓库根目录执行：

```bash
vp install
vp run @bc/env#test
vp run @bc/env#build
```

也可以进入 `tools/env` 后执行：

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

在应用的 `vite.config.ts` 中引入插件，并和应用自己的配置一起合并：

```ts
import config from "@bc/config/vite.react";
import env from "@bc/env";
import { defineConfig, mergeConfig } from "vite-plus";

export default mergeConfig(
  config,
  defineConfig({
    plugins: [env()],
  }),
);
```

插件会读取两类 env 文件：

- `@bc/env` 包内的 `.env*`：用于提供跨应用默认值。
- 当前应用 `envDir` 下的 `.env*`：用于提供应用自己的值。

支持的文件顺序和 Vite 保持一致：

```text
.env
.env.local
.env.[mode]
.env.[mode].local
```

应用自己的 env 会覆盖共享默认值。插件只注入 env 文件里显式声明过的 key，不把外部 `process.env` 全量写进 `config.env`。

## 开发约定

- 共享默认值只放跨应用一致的配置，不放某个应用私有的环境变量。
- 不在 README 中写具体密钥、账号、token 或真实服务地址。
- 私密值应放在 `.env.local` 或部署平台配置中，不提交到仓库。
- 新增共享 env key 时，要同步说明消费方式或在使用方代码中体现类型约束。
- 修改加载顺序、覆盖规则或监听逻辑时，要同步更新测试，避免不同模式下行为漂移。
- dev server 需要监听 env 文件新增、修改、删除，并在变化后重启服务。

## 测试标准

`@bc/env` 是 Vite+ 插件，测试应覆盖插件行为，而不是只断言内部函数实现。

- 覆盖包内默认 env 能被注入到 `config.env`。
- 覆盖应用 env 能覆盖包内默认值。
- 覆盖没有出现在 env 文件中的 `process.env` key 不会被额外注入。
- 覆盖 `envDir: false` 时只加载包内默认值。
- 覆盖不同 `mode` 下 `.env.[mode]` 和 `.env.[mode].local` 的读取规则。
- 覆盖 dev server 监听到 env 文件 `add`、`change`、`unlink` 后会触发重启。
- 测试中创建临时 env 文件时要隔离目录，并在测试结束后清理。

测试文件使用 `*.test.ts` 命名，放在 `tests` 目录或和被测逻辑相近的位置。优先构造最小 Vite+ 插件上下文，不依赖真实应用启动。

## 提交前检查

提交涉及本包的改动前至少执行：

```bash
vp run @bc/env#test
vp run @bc/env#build
```

如果修改会影响应用 env 行为，再验证使用方：

```bash
vp run bc-app#build
```

跨包改动或不确定影响范围时执行仓库级验证：

```bash
vp run ready
```
