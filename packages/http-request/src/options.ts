import type { InternalAxiosRequestConfig } from "axios";

import type { HttpError } from "./error.js";
import { defaultGetCode, defaultGetData, defaultGetMessage, defaultIsSuccess } from "./response.js";
import type {
  DuplicateOptions,
  HttpOptions,
  InternalRequestConfig,
  RequestMeta,
  RequiredHttpOptions,
  RetryOptions,
} from "./types.js";
import { stableStringify } from "./utils.js";

export function createOptions(options: HttpOptions): RequiredHttpOptions {
  return {
    auth: options.auth ?? {},
    duplicate: resolveDuplicateOptions(options.duplicate),
    platform: options.platform ?? {},
    response: {
      getCode: options.response?.getCode ?? defaultGetCode,
      getData: options.response?.getData ?? defaultGetData,
      getMessage: options.response?.getMessage ?? defaultGetMessage,
      isSuccess: options.response?.isSuccess ?? defaultIsSuccess,
    },
    retry: {
      delay: options.retry?.delay ?? 300,
      retries: options.retry?.retries ?? 0,
      shouldRetry: options.retry?.shouldRetry ?? defaultShouldRetry,
    },
  };
}

export function resolveDuplicateOptions(duplicate: HttpOptions["duplicate"]): DuplicateOptions {
  if (duplicate === false) {
    return {
      enabled: false,
      keyResolver: defaultDuplicateKeyResolver,
    };
  }

  return {
    enabled: duplicate === true || duplicate?.enabled === true,
    keyResolver:
      duplicate && typeof duplicate !== "boolean" && duplicate.keyResolver
        ? duplicate.keyResolver
        : defaultDuplicateKeyResolver,
  };
}

export function resolveRetryOptions(
  metaRetry: RequestMeta["retry"],
  defaultRetry: RetryOptions,
): RetryOptions {
  if (metaRetry === false) {
    return {
      ...defaultRetry,
      retries: 0,
    };
  }

  if (metaRetry === true || metaRetry === undefined) return defaultRetry;

  return {
    ...defaultRetry,
    ...metaRetry,
  };
}

export function defaultShouldRetry(error: HttpError): boolean {
  if (!error.status) return true;
  if (error.status === 408 || error.status === 429) return true;
  return error.status >= 500;
}

export function defaultDuplicateKeyResolver(config: InternalAxiosRequestConfig): string {
  const method = (config.method ?? "GET").toUpperCase();
  const url = [config.baseURL, config.url].filter(Boolean).join("");
  return `${method} ${url} ${stableStringify(config.params)} ${stableStringify(config.data)}`;
}

export function resolveDuplicateKey(
  config: InternalRequestConfig,
  resolver: DuplicateOptions["keyResolver"],
): string {
  const duplicateKey = config.meta?.duplicateKey;
  if (typeof duplicateKey === "string") return duplicateKey;
  if (typeof duplicateKey === "function") return duplicateKey(config);
  return resolver(config);
}
