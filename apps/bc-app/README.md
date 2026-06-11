# bc-app

## 常用命令

在仓库根目录执行：

```bash
vp install
vp run bc-app#dev
vp run bc-app#test
vp run bc-app#build
```

也可以进入 `apps/bc-app` 后执行：

```bash
vp run dev
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

- 页面入口放在 `src/pages`，路由由 `@bc/router` 根据文件自动生成。
- 页面文件使用 `index.tsx` 并导出 `Page`。
- 页面元信息放在同级 `meta.ts`，按路由插件支持的字段导出。
- 只在应用层编排页面、路由、模型和依赖注入；可复用 UI 放到 `@bc/components`，通用逻辑放到对应工具包。
- 不在 README 中沉淀当前占位页面或临时示例的说明。

## 测试标准

本应用包当前以浏览器端 e2e 测试为主，覆盖用户能实际操作的页面流程。

- 新增或修改页面、跳转、权限判断、表单提交流程时，要补充或更新 e2e 测试。
- 测试文件使用 `*.e2e.test.tsx` 命名，优先和被测页面放在相近目录。
- 测试只断言用户可感知的结果，例如页面文本、按钮状态、跳转结果、提交后的反馈；不要断言组件内部实现细节。
- 优先使用 role、label、text 等稳定查询方式，不依赖 className、DOM 层级或截图像素。
- 每个测试应保持独立，不依赖另一个测试先运行；需要登录、数据或本地状态时，在测试内显式准备。
- 如果流程依赖接口，优先使用可控的测试数据或 mock，不把线上环境作为测试前提。
- 发现 bug 时先写能复现问题的失败测试，再修复实现。

## 怎么写 e2e 测试

测试使用 Playwright 驱动浏览器，断言从 `vite-plus/test` 导入。

```tsx
import { chromium } from "playwright";
import { expect, test } from "vite-plus/test";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();

test("页面主流程可用", async () => {
  await page.goto("http://localhost:5173/");

  expect(await page.getByRole("button", { name: "提交" }).isVisible()).toBe(true);
  await page.getByRole("button", { name: "提交" }).click();
  expect(await page.getByText("提交成功").isVisible()).toBe(true);
});
```

运行 e2e 前先启动本应用开发服务：

```bash
vp run bc-app#dev
```

再在另一个终端运行：

```bash
vp run bc-app#test
```

如果端口不是 `5173`，需要同步调整测试里的访问地址，或抽出统一的测试 base URL。

## 提交前检查

提交涉及本应用的改动前至少执行：

```bash
vp run bc-app#test
vp run bc-app#build
```

跨包改动或不确定影响范围时执行仓库级验证：

```bash
vp run ready
```
