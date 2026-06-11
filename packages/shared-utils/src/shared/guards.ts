import type { Dictionary } from "./types.ts";

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPlainObject(value: unknown): value is Dictionary {
  return Object.prototype.toString.call(value) === "[object Object]";
}
