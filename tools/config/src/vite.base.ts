import { existsSync } from "node:fs";
import path from "node:path";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

const configDir = path.join(process.cwd(), ".storybook");
const { default: packageJson } = await import(path.join(process.cwd(), "package.json"), {
  with: { type: "json" },
});

export default defineConfig({
  server: {
    cors: { allowedHeaders: ["Access-Control-Allow-Origin"] },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins:
          existsSync(configDir) && packageJson?.scripts?.storybook
            ? [
                storybookTest({
                  configDir,
                  tags: {
                    include: ["test"],
                    exclude: ["skip-test"],
                  },
                  storybookScript: "pnpm storybook --no-open",
                }),
              ]
            : [],
        test: {
          include: [],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "./temp/**",
            "**.*.e2e.test.{js,ts,jsx,tsx}",
          ],
          name: "storybook",
          // Enable browser mode
          browser: {
            enabled: true,
            // Make sure to install Playwright
            provider: playwright(process.env.CI ? {} : { launchOptions: { channel: "chrome" } }),
            headless: process.env.CI ? true : false,
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        test: {
          name: "e2e",
          include: ["./**/*.e2e.test.{js,ts,jsx,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**", "./temp/**"],
        },
      },
    ],
  },
});
