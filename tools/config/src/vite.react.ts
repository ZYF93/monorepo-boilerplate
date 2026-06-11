import "./types.d.ts";

import pluginDecorators from "@babel/plugin-proposal-decorators";
import presetEnv from "@babel/preset-env";
import presetTS from "@babel/preset-typescript";
import babel from "@rolldown/plugin-babel";
import tailwindPlugin from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vite-plus";

import config from "./vite.base.ts";

export default mergeConfig(
  config,
  defineConfig({
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tailwindPlugin(),
      react(),
      babel({
        presets: [[presetEnv, { modules: false }], presetTS],
        plugins: [[pluginDecorators, { version: "2023-11" }]],
      }),
    ],
  }),
);
