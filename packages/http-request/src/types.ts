import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  GenericAbortSignal,
  InternalAxiosRequestConfig,
} from "axios";

import type { HttpClient } from "./client.js";
import type { HttpError } from "./error.js";

export type Awaitable<T> = T | Promise<T>;
export type Maybe<T> = T | null | undefined;
export type HeaderRecord = Record<string, string>;

export type RequestMeta = {
  rawResponse?: boolean;
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
  skipDuplicateCancel?: boolean;
  retry?: boolean | Partial<RetryOptions>;
  duplicateKey?: string | ((config: InternalAxiosRequestConfig) => string);
};

export type RequestConfig<D = unknown> = AxiosRequestConfig<D> & {
  meta?: RequestMeta;
};

export type ApiEnvelope<T = unknown> = {
  code?: string | number;
  data?: T;
  message?: string;
  msg?: string;
  success?: boolean;
  [key: string]: unknown;
};

export type PlatformAdapter = {
  toast?: (message: string, error: HttpError) => void;
  showLoading?: () => void;
  hideLoading?: () => void;
  redirectToLogin?: (error: HttpError) => void;
  getExtraHeaders?: (config: InternalAxiosRequestConfig) => Awaitable<Maybe<HeaderRecord>>;
};

export type AuthAdapter = {
  headerName?: string;
  tokenPrefix?: string;
  getToken?: () => Awaitable<Maybe<string>>;
  refreshToken?: () => Awaitable<Maybe<string>>;
  clearToken?: () => Awaitable<void>;
  shouldRefresh?: (error: HttpError) => boolean;
  onAuthExpired?: (error: HttpError) => Awaitable<void>;
};

export type ResponseAdapter = {
  isSuccess?: (body: unknown, response: AxiosResponse) => boolean;
  getData?: <T>(body: unknown, response: AxiosResponse) => T;
  getMessage?: (body: unknown, response?: AxiosResponse) => string;
  getCode?: (body: unknown, response?: AxiosResponse) => string | number | undefined;
};

export type RetryOptions = {
  retries: number;
  delay: number;
  shouldRetry: (error: HttpError) => boolean;
};

export type DuplicateOptions = {
  enabled: boolean;
  keyResolver: (config: InternalAxiosRequestConfig) => string;
};

export type HttpPlugin = {
  name: string;
  setup: (context: HttpPluginContext) => void;
};

export type HttpPluginContext = {
  client: HttpClient;
  instance: AxiosInstance;
  options: RequiredHttpOptions;
};

type DefinedRequestArgs<Payload> = [Payload] extends [void]
  ? [payload?: Payload, config?: RequestConfig<Payload>]
  : [payload: Payload, config?: RequestConfig<Payload>];

export type DefinedRequest<Payload = void, Response = unknown> = (
  ...args: DefinedRequestArgs<Payload>
) => Promise<Response>;

export type HttpOptions = {
  /**
   * 请求基础地址。
   *
   * 适合配置当前应用的网关地址，例如 Web 管理端的 `/api`
   * 或 H5 活动页的 `https://m.example.com/api`。该值会透传给
   * axios 的 `baseURL`。
   */
  baseURL?: string;

  /**
   * 全局请求超时时间，单位为毫秒。
   *
   * 未配置时默认使用 `15000`。如果某个应用场景网络条件较弱，
   * 可以在创建业务实例时单独调小或调大。
   */
  timeout?: number;

  /**
   * 全局默认请求头。
   *
   * 适合放置固定头，例如租户标识、渠道标识、客户端版本等。
   * 动态头建议使用 `platform.getExtraHeaders`，避免在实例创建时固化。
   */
  headers?: HeaderRecord;

  /**
   * 原生 axios 配置。
   *
   * 用于透传当前封装未显式暴露的 axios 能力，例如 `adapter`、
   * `withCredentials`、`responseType` 等。这里的配置会与 `baseURL`、
   * `timeout`、`headers` 一起传给 `axios.create`。
   */
  axiosConfig?: AxiosRequestConfig;

  /**
   * 认证适配器。
   *
   * 用于注入 token 读取、token 刷新、登录态清理和登录过期处理。
   * 核心包不会直接依赖 localStorage、store 或路由跳转，Web/H5
   * 的差异都应通过该配置接入。
   */
  auth?: AuthAdapter;

  /**
   * 后端响应协议适配器。
   *
   * 默认兼容 `{ code, data, message, success }` 一类常见结构。
   * 如果网关返回 `{ errno, result, errmsg }` 或其他结构，可以在这里
   * 自定义成功判断、数据提取、错误文案和业务码提取逻辑。
   */
  response?: ResponseAdapter;

  /**
   * 全局失败重试策略。
   *
   * 默认不重试。可配置重试次数、重试间隔，以及哪些错误需要重试。
   * 单个请求可以通过 `meta.retry` 覆盖或关闭该策略。
   */
  retry?: Partial<RetryOptions>;

  /**
   * 重复请求取消策略。
   *
   * 传 `true` 开启默认去重：相同 method、url、params、data 的新请求
   * 会取消上一个未完成请求。也可以传入 `keyResolver` 自定义重复请求
   * 的判定方式。
   */
  duplicate?: boolean | Partial<DuplicateOptions>;

  /**
   * 平台适配器。
   *
   * 用于接入 toast、loading、跳转登录页、动态请求头等运行时能力。
   * Web 管理端、H5、微前端子应用可以各自注入不同实现。
   */
  platform?: PlatformAdapter;

  /**
   * 请求插件列表。
   *
   * 插件会拿到当前 `HttpClient`、axios 实例和标准化后的选项，
   * 适合扩展签名、埋点、调试日志、灰度头等横切能力。
   */
  plugins?: HttpPlugin[];
};

export type RequiredHttpOptions = {
  auth: AuthAdapter;
  response: Required<ResponseAdapter>;
  retry: RetryOptions;
  duplicate: DuplicateOptions;
  platform: PlatformAdapter;
};

export type RequestState = {
  duplicateKey?: string;
  duplicateId?: symbol;
  retryCount?: number;
  retriedAfterRefresh?: boolean;
  userSignal?: GenericAbortSignal;
};

export type InternalRequestConfig = InternalAxiosRequestConfig & {
  meta?: RequestMeta;
  requestState?: RequestState;
};

export type PendingDuplicate = {
  id: symbol;
  controller: AbortController;
};
