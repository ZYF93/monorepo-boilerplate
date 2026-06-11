import type { GenericAbortSignal, InternalAxiosRequestConfig } from "axios";

import type { AuthAdapter } from "./types.js";

export function formatToken(token: string, auth: AuthAdapter): string {
  return auth.tokenPrefix ? `${auth.tokenPrefix} ${token}` : token;
}

export function setHeader(config: InternalAxiosRequestConfig, key: string, value: string): void {
  config.headers.set(key, value);
}

export function composeSignals(
  signal: AbortSignal,
  userSignal?: GenericAbortSignal,
): GenericAbortSignal {
  if (!userSignal) return signal;
  if (userSignal.aborted) return userSignal;

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  userSignal.addEventListener?.("abort", abort, { once: true });
  return controller.signal;
}

export function stableStringify(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (value === null) return "null";
  if (typeof value === "symbol") return value.description ?? "";
  return JSON.stringify(sortDeep(value));
}

export function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortDeep(value[key])]),
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
