# @bc/components

组件库脚手架包。这里不描述具体组件能力，只记录组件开发、Storybook 和测试约定。

## 常用命令

在仓库根目录执行：

```bash
vp install
vp run @bc/components#storybook
vp run @bc/components#test
vp run @bc/components#build
```

也可以进入 `packages/components` 后执行：

```bash
vp run storybook
vp run test
vp run build
```

仓库级验证使用：

```bash
vp check
vp run -r test
vp run -r build
```

## 开发约定

- 组件应保持可复用，不依赖具体应用页面、路由或业务模型。
- 对外导出的组件统一从 `src/index.ts` 暴露。
- 组件样式应通过组件库入口或 Storybook preview 能加载到的方式提供，避免只在应用里生效。
- 新组件要配套 Storybook stories，用 stories 表达组件状态、交互和边界场景。
- 不为单个组件引入一次性抽象；先让组件 API 足够清晰，再考虑提取公共能力。

## Storybook 约定

- Story 文件使用 `*.stories.ts` 或 `*.stories.tsx` 命名，放在组件相近目录。
- 每个组件至少提供一个默认使用场景；有状态差异时补充必要变体。
- `meta` 不手写 `title`，让 Storybook 根据文件路径组织目录。
- 需要进入自动化测试的 stories 必须包含 `tags: ["test"]`。
- 只在能证明行为时写 `play`，例如点击、输入、键盘操作、异步加载完成；静态变体不需要重复写可见性断言。
- 查询元素优先使用 role、label、text，避免依赖 className 或 DOM 层级。

示例：

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Button } from "./Button";

const meta = {
  component: Button,
  tags: ["test"],
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "提交" },
  async play({ canvas, userEvent, args }) {
    await userEvent.click(await canvas.findByRole("button", { name: "提交" }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

## 测试标准

组件库测试以 Storybook + Vitest browser project 为主，覆盖组件渲染、交互、可访问性基础和样式是否正确加载。

- 新增组件时必须新增 story；如果组件有交互，至少一个 story 要用 `play` 覆盖核心交互。
- 修复组件 bug 时先补充能复现问题的 story 或测试，再修复实现。
- 对视觉样式有要求的组件，应在至少一个 story 中断言关键的 `getComputedStyle` 值，避免只验证“能渲染”。
- 对异步状态要覆盖 loading、成功、失败或空态中实际存在的分支。
- 不 mock React、浏览器基础 API 或组件内部实现；需要网络数据时，把 mock 放到 Storybook preview 或 MSW handlers 一类共享配置里。
- 可访问性问题默认应在 Storybook a11y 面板中处理；会影响用户操作的 a11y 问题要进入自动化断言。
- 测试应稳定、独立、可重复，不依赖执行顺序或外部线上服务。

样式断言示例：

```tsx
export const CssCheck: Story = {
  args: { children: "提交" },
  async play({ canvas }) {
    const button = await canvas.findByRole("button", { name: "提交" });
    await expect(getComputedStyle(button).backgroundColor).toBe("rgb(59, 130, 246)");
  },
};
```

## 提交前检查

提交涉及组件库的改动前至少执行：

```bash
vp run @bc/components#test
vp run @bc/components#build
```

跨包改动或不确定影响范围时执行仓库级验证：

```bash
vp run ready
```
