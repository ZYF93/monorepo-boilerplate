import config from "@bc/config/vite.react";
import env from "@bc/env";
import router from "@bc/router";
import { defineConfig, mergeConfig } from "vite-plus";

export default mergeConfig(
  config,
  defineConfig({
    plugins: [router(), env()],
  }),
);
