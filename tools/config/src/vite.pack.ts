import pluginDecorators from "@babel/plugin-proposal-decorators";
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { mergeConfig, type UserConfig } from "vite-plus";

import postcss from "./postcss.config.ts";
import config from "./vite.base.ts";

export default mergeConfig(config, {
  pack: {
    css: {
      inject: true,
      postcss,
      transformer: "postcss",
    },
    plugins: [
      react(),
      babel({
        plugins: [[pluginDecorators, { version: "2023-11" }]],
      }),
    ],
    dts: {
      tsgo: true,
    },
    deps: {
      neverBundle: ["zod", "@e7w/easy-model", "react", "react-dom", "react-router", "vite-plus"],
    },
    copy: ["./src/**/*.d.ts"],
  } as UserConfig,
});
