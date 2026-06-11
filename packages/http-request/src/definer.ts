import type { AxiosResponse } from "axios";

import type { HttpClient } from "./client.js";
import type { DefinedRequest, RequestConfig } from "./types.js";

export class HttpRequestDefiner {
  constructor(private readonly client: HttpClient) {}

  get<Query = void, Response = unknown>(
    url: string,
    presetConfig: RequestConfig = {},
  ): DefinedRequest<Query, Response> {
    return defineRequest<Query, Response>((query, config) =>
      this.client.get<Response>(url, withParams(presetConfig, config, query)),
    );
  }

  delete<Query = void, Response = unknown>(
    url: string,
    presetConfig: RequestConfig = {},
  ): DefinedRequest<Query, Response> {
    return defineRequest<Query, Response>((query, config) =>
      this.client.delete<Response>(url, withParams(presetConfig, config, query)),
    );
  }

  post<Body = void, Response = unknown>(
    url: string,
    presetConfig: RequestConfig<Body> = {},
  ): DefinedRequest<Body, Response> {
    return defineRequest<Body, Response>((body, config) =>
      this.client.post<Response, Body>(url, body, mergeRequestConfig(presetConfig, config)),
    );
  }

  put<Body = void, Response = unknown>(
    url: string,
    presetConfig: RequestConfig<Body> = {},
  ): DefinedRequest<Body, Response> {
    return defineRequest<Body, Response>((body, config) =>
      this.client.put<Response, Body>(url, body, mergeRequestConfig(presetConfig, config)),
    );
  }

  patch<Body = void, Response = unknown>(
    url: string,
    presetConfig: RequestConfig<Body> = {},
  ): DefinedRequest<Body, Response> {
    return defineRequest<Body, Response>((body, config) =>
      this.client.patch<Response, Body>(url, body, mergeRequestConfig(presetConfig, config)),
    );
  }

  request<Payload = void, Response = unknown>(
    presetConfig: RequestConfig<Payload>,
  ): DefinedRequest<Payload, Response> {
    return defineRequest<Payload, Response>((payload, config) =>
      this.client.request<Response, Payload>({
        ...mergeRequestConfig(presetConfig, config),
        data: payload,
      }),
    );
  }

  raw<Payload = void, ResponseData = unknown, Response = AxiosResponse<ResponseData>>(
    presetConfig: RequestConfig<Payload>,
  ): DefinedRequest<Payload, Response> {
    return defineRequest<Payload, Response>((payload, config) =>
      this.client.raw<ResponseData, Response, Payload>({
        ...mergeRequestConfig(presetConfig, config),
        data: payload,
      }),
    );
  }
}

function defineRequest<Payload, Response>(
  request: (payload: Payload | undefined, config?: RequestConfig<Payload>) => Promise<Response>,
): DefinedRequest<Payload, Response> {
  return ((payload?: Payload, config?: RequestConfig<Payload>) =>
    request(payload, config)) as DefinedRequest<Payload, Response>;
}

function withParams<Query>(
  presetConfig: RequestConfig,
  config: RequestConfig<Query> | undefined,
  query: Query | undefined,
): RequestConfig {
  const nextConfig = mergeRequestConfig(presetConfig, config);
  if (query !== undefined) {
    nextConfig.params = query;
  }
  return nextConfig;
}

function mergeRequestConfig<D>(
  presetConfig: RequestConfig<D>,
  config?: RequestConfig<D>,
): RequestConfig<D> {
  return {
    ...presetConfig,
    ...config,
    meta: {
      ...presetConfig.meta,
      ...config?.meta,
    },
  };
}
