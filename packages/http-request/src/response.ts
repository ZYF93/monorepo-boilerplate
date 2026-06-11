import type { AxiosError, AxiosResponse } from "axios";
import axios from "axios";

import { HttpError } from "./error.js";
import type { ResponseAdapter } from "./types.js";
import { isRecord } from "./utils.js";

export function normalizeError(error: unknown, response: Required<ResponseAdapter>): HttpError {
  if (error instanceof HttpError) return error;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const body = axiosError.response?.data;
    return new HttpError(
      body
        ? response.getMessage(body, axiosError.response)
        : axiosError.message || "Request failed",
      {
        code: body ? response.getCode(body, axiosError.response) : axiosError.code,
        config: axiosError.config,
        data: body,
        original: error,
        response: axiosError.response,
        status: axiosError.response?.status,
      },
    );
  }

  if (error instanceof Error) {
    return new HttpError(error.message, { original: error });
  }

  return new HttpError(String(error), { original: error });
}

export function defaultIsSuccess(body: unknown, response: AxiosResponse): boolean {
  if (response.status < 200 || response.status >= 300) return false;
  if (!isRecord(body)) return true;
  if (typeof body.success === "boolean") return body.success;
  if (body.code === undefined) return true;

  return body.code === 0 || body.code === "0" || body.code === 200 || body.code === "200";
}

export function defaultGetData<T>(body: unknown): T {
  if (isRecord(body) && "data" in body) return body.data as T;
  return body as T;
}

export function defaultGetMessage(body: unknown): string {
  if (isRecord(body)) {
    const message = body.message ?? body.msg;
    if (typeof message === "string" && message) return message;
  }

  return "Request failed";
}

export function defaultGetCode(body: unknown): string | number | undefined {
  if (!isRecord(body)) return undefined;
  return body.code as string | number | undefined;
}
