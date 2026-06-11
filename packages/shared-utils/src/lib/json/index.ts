import type { JsonParseOptions, ToJsonOptions } from "./types.ts";

export type { JsonParseOptions, ToJsonOptions } from "./types.ts";

export function jsonParse<T = unknown>(
  value: string,
  options?: JsonParseOptions<T>,
): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return options?.fallback;
  }
}

export function toJson(value: unknown, options: ToJsonOptions = {}): string {
  try {
    return JSON.stringify(value, null, options.space);
  } catch {
    return "";
  }
}

export function jsonClone<T>(value: T): T {
  const cloned = jsonParse<T>(toJson(value), { fallback: value });
  return cloned ?? value;
}
