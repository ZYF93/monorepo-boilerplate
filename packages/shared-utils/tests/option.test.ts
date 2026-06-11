import { expect, test } from "vite-plus/test";

import { defineOptions, getOptionLabel } from "../src/lib/option/index.ts";

test("defines option helpers", () => {
  const statusOptions = defineOptions([
    [1, "启用"],
    [0, "停用"],
  ]);

  expect(statusOptions.getLabel(1)).toBe("启用");
  expect(statusOptions.getValue("停用")).toBe(0);
  expect(getOptionLabel(statusOptions.list, 1)).toBe("启用");
});
