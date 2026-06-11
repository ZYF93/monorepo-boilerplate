import type { AxiosRequestConfig, AxiosResponse } from "axios";

export class HttpError<T = unknown> extends Error {
  code?: string | number;
  status?: number;
  data?: T;
  response?: AxiosResponse;
  config?: AxiosRequestConfig;
  original?: unknown;

  constructor(message: string, options: Partial<HttpError<T>> = {}) {
    super(message);
    this.name = "HttpError";
    Object.assign(this, options);
  }
}
