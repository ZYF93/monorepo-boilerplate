import config from "@bc/config/vite.pack";
import { defineConfig, mergeConfig, type UserConfig } from "vite-plus";

export default mergeConfig(
  config as UserConfig,
  defineConfig({
    pack: {
      entry: {
        browser: "./src/lib/browser/index.ts",
        validator: "./src/lib/validator/index.ts",
        json: "./src/lib/json/index.ts",
        option: "./src/lib/option/index.ts",
      },
    },
  }),
);
