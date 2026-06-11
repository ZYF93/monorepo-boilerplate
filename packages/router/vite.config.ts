import config from "@bc/config/vite.pack";
import { defineConfig, mergeConfig, type UserConfig } from "vite-plus";

export default mergeConfig(
  config as UserConfig,
  defineConfig({
    pack: {
      entry: {
        index: "./src/index.ts",
        components: "./src/components/index.ts",
      },
    },
  }),
);
