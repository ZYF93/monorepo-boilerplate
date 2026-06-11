import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import type { Config } from "postcss-load-config";

export default {
  plugins: [
    autoprefixer(),
    tailwindcss({
      optimize: true,
    }),
  ],
} satisfies Config;
