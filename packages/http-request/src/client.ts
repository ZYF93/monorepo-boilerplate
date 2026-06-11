import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

import { HttpRequestDefiner } from "./definer.js";
import { HttpError } from "./error.js";
import { createOptions, resolveDuplicateKey, resolveRetryOptions } from "./options.js";
import { normalizeError } from "./response.js";
import type {
  HttpOptions,
  InternalRequestConfig,
  Maybe,
  PendingDuplicate,
  RequestConfig,
  RequiredHttpOptions,
} from "./types.js";
import { composeSignals, formatToken, setHeader, sleep } from "./utils.js";

export class HttpClient {
  readonly instance: AxiosInstance;
  readonly define: HttpRequestDefiner;
  private readonly options: RequiredHttpOptions;
  private readonly pendingDuplicates = new Map<string, PendingDuplicate>();
  private refreshing?: Promise<Maybe<string>>;
  private loadingCount = 0;

  constructor(options: HttpOptions = {}) {
    this.options = createOptions(options);
    this.instance = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 15_000,
      headers: options.headers,
      ...options.axiosConfig,
    });

    this.instance.interceptors.request.use((config) => this.handleRequest(config));
    this.instance.interceptors.response.use(
      (response) => this.handleResponse(response) as AxiosResponse,
      (error) => this.handleError(error),
    );
    this.define = new HttpRequestDefiner(this);

    for (const plugin of options.plugins ?? []) {
      plugin.setup({
        client: this,
        instance: this.instance,
        options: this.options,
      });
    }
  }

  raw<T = unknown, R = AxiosResponse<T>, D = unknown>(config: RequestConfig<D>): Promise<R> {
    return this.instance.request<T, R, D>({
      ...config,
      meta: {
        ...config.meta,
        rawResponse: true,
      },
    } as RequestConfig<D>);
  }

  request<T = unknown, D = unknown>(config: RequestConfig<D>): Promise<T> {
    return this.instance.request<unknown, T, D>(config);
  }

  get<T = unknown, P = unknown>(url: string, config: RequestConfig<P> = {}): Promise<T> {
    return this.request<T, P>({ ...config, method: "GET", url });
  }

  delete<T = unknown, P = unknown>(url: string, config: RequestConfig<P> = {}): Promise<T> {
    return this.request<T, P>({ ...config, method: "DELETE", url });
  }

  post<T = unknown, D = unknown>(url: string, data?: D, config: RequestConfig<D> = {}): Promise<T> {
    return this.request<T, D>({ ...config, data, method: "POST", url });
  }

  put<T = unknown, D = unknown>(url: string, data?: D, config: RequestConfig<D> = {}): Promise<T> {
    return this.request<T, D>({ ...config, data, method: "PUT", url });
  }

  patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config: RequestConfig<D> = {},
  ): Promise<T> {
    return this.request<T, D>({ ...config, data, method: "PATCH", url });
  }

  async setAuthHeader(config: InternalRequestConfig): Promise<void> {
    if (config.meta?.skipAuth) return;

    const token = await this.options.auth.getToken?.();
    if (!token) return;

    setHeader(
      config,
      this.options.auth.headerName ?? "Authorization",
      formatToken(token, this.options.auth),
    );
  }

  dispose(): void {
    for (const pending of this.pendingDuplicates.values()) {
      pending.controller.abort();
    }
    this.pendingDuplicates.clear();
  }

  private async handleRequest(config: InternalAxiosRequestConfig): Promise<InternalRequestConfig> {
    const nextConfig = config as InternalRequestConfig;
    nextConfig.requestState = nextConfig.requestState ?? {};
    nextConfig.requestState.userSignal = nextConfig.signal;

    this.beginLoading();
    this.registerDuplicate(nextConfig);

    await this.setAuthHeader(nextConfig);
    const extraHeaders = await this.options.platform.getExtraHeaders?.(nextConfig);
    if (extraHeaders) {
      for (const [key, value] of Object.entries(extraHeaders)) {
        setHeader(nextConfig, key, value);
      }
    }

    return nextConfig;
  }

  private handleResponse(response: AxiosResponse): unknown {
    this.finish(response.config as InternalRequestConfig);

    const config = response.config as InternalRequestConfig;
    if (config.meta?.rawResponse) return response;

    const { response: responseAdapter } = this.options;
    if (!responseAdapter.isSuccess(response.data, response)) {
      const error = new HttpError(responseAdapter.getMessage(response.data, response), {
        code: responseAdapter.getCode(response.data, response),
        config,
        data: response.data,
        response,
        status: response.status,
      });
      this.handleFinalError(error);
      throw error;
    }

    return responseAdapter.getData(response.data, response);
  }

  private async handleError(error: unknown): Promise<never> {
    const httpError = normalizeError(error, this.options.response);
    const config = httpError.config as InternalRequestConfig | undefined;

    this.finish(config);

    if (config && this.shouldRefresh(httpError, config)) {
      try {
        await this.refreshToken(httpError);
        config.requestState = {
          ...config.requestState,
          retriedAfterRefresh: true,
        };
        return await this.instance.request(config);
      } catch (refreshError) {
        const normalizedRefreshError = normalizeError(refreshError, this.options.response);
        await this.handleAuthExpired(normalizedRefreshError);
        this.handleFinalError(normalizedRefreshError);
        throw normalizedRefreshError;
      }
    }

    if (config && this.shouldRetry(httpError, config)) {
      config.requestState = {
        ...config.requestState,
        retryCount: (config.requestState?.retryCount ?? 0) + 1,
      };
      await sleep(resolveRetryOptions(config.meta?.retry, this.options.retry).delay);
      return await this.instance.request(config);
    }

    if (httpError.status === 401) {
      await this.handleAuthExpired(httpError);
    }

    this.handleFinalError(httpError);
    throw httpError;
  }

  private registerDuplicate(config: InternalRequestConfig): void {
    if (!this.options.duplicate.enabled || config.meta?.skipDuplicateCancel) return;

    const key = resolveDuplicateKey(config, this.options.duplicate.keyResolver);
    const existing = this.pendingDuplicates.get(key);
    if (existing) existing.controller.abort();

    const controller = new AbortController();
    const id = Symbol(key);
    this.pendingDuplicates.set(key, { controller, id });

    config.requestState = {
      ...config.requestState,
      duplicateId: id,
      duplicateKey: key,
    };
    config.signal = composeSignals(controller.signal, config.requestState.userSignal);
  }

  private finish(config?: InternalRequestConfig): void {
    this.endLoading();
    if (!config?.requestState?.duplicateKey || !config.requestState.duplicateId) return;

    const pending = this.pendingDuplicates.get(config.requestState.duplicateKey);
    if (pending?.id === config.requestState.duplicateId) {
      this.pendingDuplicates.delete(config.requestState.duplicateKey);
    }
  }

  private beginLoading(): void {
    if (this.loadingCount++ === 0) {
      this.options.platform.showLoading?.();
    }
  }

  private endLoading(): void {
    if (this.loadingCount === 0) return;

    this.loadingCount -= 1;
    if (this.loadingCount === 0) {
      this.options.platform.hideLoading?.();
    }
  }

  private shouldRefresh(error: HttpError, config: InternalRequestConfig): boolean {
    if (!this.options.auth.refreshToken || config.meta?.skipAuth) return false;
    if (config.requestState?.retriedAfterRefresh) return false;

    return this.options.auth.shouldRefresh?.(error) ?? error.status === 401;
  }

  private refreshToken(error: HttpError): Promise<Maybe<string>> {
    this.refreshing ??= Promise.resolve(this.options.auth.refreshToken?.())
      .then((token) => {
        if (!token) throw error;
        return token;
      })
      .finally(() => {
        this.refreshing = undefined;
      });

    return this.refreshing;
  }

  private shouldRetry(error: HttpError, config: InternalRequestConfig): boolean {
    const retryOptions = resolveRetryOptions(config.meta?.retry, this.options.retry);
    if (retryOptions.retries <= 0) return false;
    if ((config.requestState?.retryCount ?? 0) >= retryOptions.retries) return false;

    return retryOptions.shouldRetry(error);
  }

  private async handleAuthExpired(error: HttpError): Promise<void> {
    await this.options.auth.clearToken?.();
    await this.options.auth.onAuthExpired?.(error);
    this.options.platform.redirectToLogin?.(error);
  }

  private handleFinalError(error: HttpError): void {
    const config = error.config as InternalRequestConfig | undefined;
    if (config?.meta?.skipErrorHandler) return;

    const message = error.message || "Request failed";
    this.options.platform.toast?.(message, error);
  }
}

export function createHttpClient(options: HttpOptions = {}): HttpClient {
  return new HttpClient(options);
}
