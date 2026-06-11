import { chromium } from "playwright";
import { expect, test } from "vite-plus/test";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();

test("首页页面渲染", async () => {
  await page.goto("http://localhost:5173/");
  expect(await page.getByRole("button", { name: "0" }).isVisible()).toBe(true);
  expect(await page.getByRole("button").textContent()).toBe("0");
  await page.getByRole("button", { name: "0" }).click();
  expect(await page.getByRole("button").textContent()).toBe("1");
});
