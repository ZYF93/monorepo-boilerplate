import { expect, test } from "vite-plus/test";

import { jsonParse, toJson } from "../src/lib/json/index.ts";

test("parses json safely", () => {
  expect(jsonParse<{ name: string }>('{"name":"bc"}')?.name).toBe("bc");
  expect(jsonParse("broken", { fallback: { ok: false } })).toEqual({ ok: false });
});

test("stringifies values safely", () => {
  expect(toJson({ ok: true })).toBe('{"ok":true}');
});
