# @bc/http-request

`@bc/http-request` 是基于 axios 封装的请求核心包，用于在 Web 管理端、H5、活动页、微前端子应用中复用统一的请求行为。

核心包只负责请求实例、类型、拦截器、响应解包、错误归一化、取消重复请求、失败重试和 token 刷新队列。业务差异通过 `auth`、`platform`、`response`、`plugins` 等配置注入，避免核心包直接依赖 `localStorage`、路由、store 或具体 UI 框架。

## 特性

- 基于 axios，支持透传原生 axios 配置。
- 默认解包 `{ code, data, message, msg, success }` 响应结构。
- 支持自定义后端响应协议。
- 支持 token 自动注入、401 刷新 token、登录过期处理。
- 支持全局 toast、loading、跳登录页、动态请求头等平台适配。
- 支持重复请求取消。
- 支持失败重试和单请求覆盖重试策略。
- 支持 `define` 声明类型安全的接口函数。
- 支持插件扩展 axios 实例和请求客户端。

## 安装

```sh
vp add @bc/http-request
```

如果在当前 monorepo 内部子包使用，可直接声明依赖：

```json
{
  "dependencies": {
    "@bc/http-request": "workspace:*"
  }
}
```

## 快速开始

```ts
import { createHttpClient } from "@bc/http-request";

export const request = createHttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
  auth: {
    getToken: () => localStorage.getItem("access_token"),
    tokenPrefix: "Bearer",
  },
  platform: {
    toast: (message) => window.alert(message),
    redirectToLogin: () => {
      window.location.href = `/login?from=${encodeURIComponent(location.href)}`;
    },
  },
});

export function getUserProfile() {
  return request.get<{ id: string; name: string }>("/user/profile");
}
```

默认情况下，请求会返回响应体中的业务数据：

```ts
// 后端返回：{ code: 0, data: { id: "1", name: "Ada" }, message: "ok" }
const user = await request.get<{ id: string; name: string }>("/user/profile");
// user: { id: "1", name: "Ada" }
```

## 创建实例

```ts
import { createHttpClient } from "@bc/http-request";

export const request = createHttpClient({
  baseURL: "/api",
  timeout: 15_000,
  headers: {
    "X-Client": "web",
  },
  axiosConfig: {
    withCredentials: true,
  },
});
```

`createHttpClient` 是唯一的实例工厂。Web 管理端、H5、活动页、微前端子应用都通过配置表达差异，核心包不提供 `createWebHttpClient` / `createH5HttpClient` 这类薄封装。

## 请求方法

```ts
request.request<T>({ url: "/users", method: "GET" });
request.get<T>("/users", { params: { page: 1 } });
request.delete<T>("/users/1");
request.post<T, Body>("/users", { name: "Ada" });
request.put<T, Body>("/users/1", { name: "Ada" });
request.patch<T, Body>("/users/1", { name: "Ada" });
request.raw<T>({ url: "/users", method: "GET" });
```

说明：

- `request`、`get`、`delete`、`post`、`put`、`patch` 默认返回解包后的业务数据。
- `raw` 返回完整 axios response，适合读取响应头、状态码、文件下载等场景。
- 所有请求配置都支持 axios 原生配置，并额外支持 `meta`。

## 定义接口函数

推荐在业务模块中使用 `request.define` 先声明接口函数，再在页面或业务逻辑中调用。

```ts
// services/modules/user.ts
type UserDataQuery = {
  id: string;
};

type UserDataResponse = {
  name: string;
};

export const getUserDataApi = request.define.get<UserDataQuery, UserDataResponse>(
  "/api/user-data/get",
);

const user = await getUserDataApi({ id: "1" });
```

`define` 支持的方法：

```ts
request.define.get<Query, Response>(url, presetConfig);
request.define.delete<Query, Response>(url, presetConfig);
request.define.post<Body, Response>(url, presetConfig);
request.define.put<Body, Response>(url, presetConfig);
request.define.patch<Body, Response>(url, presetConfig);
request.define.request<Payload, Response>(presetConfig);
request.define.raw<Payload, ResponseData, Response>(presetConfig);
```

规则：

- `get` / `delete` 的第一个泛型是 query 类型，调用时会放入 `params`。
- `post` / `put` / `patch` 的第一个泛型是 body 类型，调用时会放入 `data`。
- 第二个泛型都是解包后的响应数据类型。
- `presetConfig.meta` 会与调用时传入的 `config.meta` 合并，调用时配置优先生效。

示例：

```ts
const updateUserApi = request.define.post<{ name: string }, { id: string }>("/users/update", {
  meta: {
    skipAuth: true,
  },
});

await updateUserApi(
  { name: "Ada" },
  {
    meta: {
      skipErrorHandler: true,
    },
  },
);
```

## 原始响应场景

默认的 `get`、`post`、`define.get`、`define.post` 等方法都会返回解包后的业务数据。如果业务需要读取响应头、状态码，或处理文件下载，应使用 `request.raw` 返回完整 axios response。

```ts
const res = await request.raw<Blob>({
  url: "/export",
  method: "GET",
  responseType: "blob",
});

const filename = res.headers["content-disposition"];
const file = res.data;
```

如果需要在 `define` 风格下声明原始响应接口，使用独立的 `request.define.raw(...)`。

示例：

```ts
const exportApi = request.define.raw<void, Blob>({
  url: "/export",
  method: "GET",
  responseType: "blob",
});

const res = await exportApi();
console.log(res.headers);
console.log(res.data);
```

带 payload 的场景：

```ts
const exportByUserApi = request.define.raw<{ userId: string }, Blob>({
  url: "/export/user",
  method: "POST",
  responseType: "blob",
});

const res = await exportByUserApi({ userId: "1" });
```

## 单次请求控制

所有请求配置都可以通过 `meta` 控制单次请求行为。

```ts
request.get("/report", {
  meta: {
    rawResponse: false,
    skipAuth: false,
    skipErrorHandler: true,
    skipDuplicateCancel: true,
    retry: { retries: 2, delay: 500 },
    duplicateKey: "GET /report/current-user",
  },
});
```

| 配置                  | 类型                               | 说明                                                         |
| --------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `rawResponse`         | `boolean`                          | 返回完整 axios response。`request.raw` 会自动设置为 `true`。 |
| `skipAuth`            | `boolean`                          | 不注入 token，也不触发 token 刷新。                          |
| `skipErrorHandler`    | `boolean`                          | 不调用全局 `platform.toast`。                                |
| `skipDuplicateCancel` | `boolean`                          | 当前请求不参与重复请求取消。                                 |
| `retry`               | `boolean \| Partial<RetryOptions>` | 覆盖单次请求重试策略，传 `false` 关闭重试。                  |
| `duplicateKey`        | `string \| (config) => string`     | 自定义当前请求的重复请求 key。                               |

## 取消请求

请求配置支持 axios 原生的 `signal`，可以通过 `AbortController` 主动取消请求。

```ts
const controller = new AbortController();

const promise = request.get("/reports/export", {
  signal: controller.signal,
});

// 在组件卸载、路由切换或用户点击取消时调用
controller.abort();

await promise;
```

在 React 组件中使用：

```tsx
useEffect(() => {
  const controller = new AbortController();

  request
    .get<User[]>("/users", {
      signal: controller.signal,
    })
    .then(setUsers)
    .catch((error) => {
      if (controller.signal.aborted) return;
      throw error;
    });

  return () => {
    controller.abort();
  };
}, []);
```

`define` 声明的接口同样支持在调用时传入 `signal`：

```ts
const getUsersApi = request.define.get<void, User[]>("/users");

const controller = new AbortController();
const users = await getUsersApi(undefined, {
  signal: controller.signal,
});
```

如果同时开启了 `duplicate`，内部重复请求取消使用的 signal 会和用户传入的 `signal` 组合；任意一方触发取消，当前请求都会被终止。

## 认证与 token 刷新

```ts
export const request = createHttpClient({
  auth: {
    headerName: "Authorization",
    tokenPrefix: "Bearer",
    getToken: () => localStorage.getItem("access_token"),
    refreshToken: async () => {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return undefined;

      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
      }).then((r) => r.json());

      localStorage.setItem("access_token", res.data.accessToken);
      return res.data.accessToken;
    },
    clearToken: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
    shouldRefresh: (error) => error.status === 401,
    onAuthExpired: () => {
      console.warn("login expired");
    },
  },
});
```

认证流程：

1. 请求发出前调用 `auth.getToken`。
2. 如果拿到 token，会写入 `auth.headerName`，默认是 `Authorization`。
3. 如果配置了 `tokenPrefix`，最终值为 `${tokenPrefix} ${token}`；否则直接使用 token。
4. 请求失败后，如果 `auth.shouldRefresh(error)` 返回 `true`，或未配置 `shouldRefresh` 且状态码是 `401`，会调用 `auth.refreshToken`。
5. 并发 401 请求只会触发一次刷新，其他请求等待同一个刷新 Promise。
6. 刷新成功后会重放原请求。
7. 刷新失败或无新 token 时，会依次调用 `auth.clearToken`、`auth.onAuthExpired`、`platform.redirectToLogin`。

## 平台适配

`platform` 用于接入和运行平台相关的能力。

```ts
export const request = createHttpClient({
  platform: {
    toast: (message, error) => {
      console.error(message, error);
    },
    showLoading: () => {
      // 显示全局 loading
    },
    hideLoading: () => {
      // 关闭全局 loading
    },
    redirectToLogin: () => {
      window.location.href = "/login";
    },
    getExtraHeaders: () => ({
      "X-Client": "h5",
      "X-Page": location.pathname,
    }),
  },
});
```

说明：

- `toast` 会在最终错误抛出前调用，可通过 `meta.skipErrorHandler` 跳过。
- `showLoading` / `hideLoading` 使用内部计数处理并发请求：第一个请求开始时显示，最后一个请求结束时关闭。
- `redirectToLogin` 会在登录态过期时调用。
- `getExtraHeaders` 每次请求前执行，适合注入设备、渠道、页面路径、租户等动态头。

## 响应协议适配

默认成功条件：

- HTTP status 是 `2xx`。
- 响应体不是对象时视为成功。
- 没有 `code` 且没有 `success` 时视为成功。
- `success === true` 视为成功。
- `code` 为 `0`、`"0"`、`200`、`"200"` 视为成功。

默认数据提取：

- 响应体包含 `data` 字段时返回 `body.data`。
- 否则返回完整响应体。

默认错误文案：

- 优先使用 `message`。
- 其次使用 `msg`。
- 都不存在时使用 `Request failed`。

如果网关协议不同，可以覆盖：

```ts
createHttpClient({
  response: {
    isSuccess: (body) => Boolean(body && (body as { errno?: number }).errno === 0),
    getData: <T>(body) => (body as { result: unknown }).result as T,
    getMessage: (body) => (body as { errmsg?: string }).errmsg || "请求失败",
    getCode: (body) => (body as { errno?: number }).errno,
  },
});
```

## 错误处理

所有请求错误都会被归一化为 `HttpError`。

```ts
import { HttpError } from "@bc/http-request";

try {
  await request.get("/bad");
} catch (error) {
  if (error instanceof HttpError) {
    console.log(error.message);
    console.log(error.code);
    console.log(error.status);
    console.log(error.data);
    console.log(error.response);
    console.log(error.config);
  }
}
```

`HttpError` 字段：

| 字段       | 说明                        |
| ---------- | --------------------------- |
| `message`  | 错误文案。                  |
| `code`     | 后端业务码或 axios 错误码。 |
| `status`   | HTTP 状态码。               |
| `data`     | 原始响应体。                |
| `response` | axios response。            |
| `config`   | axios request config。      |
| `original` | 原始错误对象。              |

## 失败重试

默认不重试。开启全局重试：

```ts
const request = createHttpClient({
  retry: {
    retries: 2,
    delay: 300,
    shouldRetry: (error) => !error.status || error.status >= 500,
  },
});
```

默认 `shouldRetry` 规则：

- 没有 HTTP status 的网络错误会重试。
- `408`、`429` 会重试。
- `5xx` 会重试。

单次请求覆盖：

```ts
// 关闭重试
request.get("/no-retry", {
  meta: {
    retry: false,
  },
});

// 覆盖重试次数和延迟
request.get("/retry", {
  meta: {
    retry: {
      retries: 3,
      delay: 1_000,
    },
  },
});
```

## 重复请求取消

默认不开启。开启后，相同 `method + baseURL + url + params + data` 的新请求会取消上一个未完成请求。

```ts
const request = createHttpClient({
  duplicate: true,
});
```

自定义全局 key：

```ts
const request = createHttpClient({
  duplicate: {
    enabled: true,
    keyResolver: (config) => `${config.method}:${config.url}`,
  },
});
```

自定义单次请求 key：

```ts
request.get("/users", {
  params: { page: 1 },
  meta: {
    duplicateKey: "users:list",
  },
});
```

跳过单次重复请求取消：

```ts
request.get("/polling", {
  meta: {
    skipDuplicateCancel: true,
  },
});
```

## 插件

插件可以访问当前 `HttpClient`、axios 实例和标准化后的配置，适合扩展签名、埋点、调试日志、灰度头等横切能力。

```ts
import type { HttpPlugin } from "@bc/http-request";

const tracePlugin: HttpPlugin = {
  name: "trace",
  setup({ instance }) {
    instance.interceptors.request.use((config) => {
      config.headers.set("X-Trace-Id", crypto.randomUUID());
      return config;
    });
  },
};

const request = createHttpClient({
  plugins: [tracePlugin],
});
```

插件会在内部请求和响应拦截器注册后执行。

## H5 配置示例

```ts
import { createHttpClient } from "@bc/http-request";

export const h5Request = createHttpClient({
  baseURL: "/h5-api",
  timeout: 10_000,
  duplicate: true,
  retry: {
    retries: 0,
  },
  auth: {
    getToken: () => sessionStorage.getItem("h5_token"),
  },
  platform: {
    getExtraHeaders: () => ({
      "X-Client": "h5",
      "X-Page": location.pathname,
    }),
    toast: (message) => {
      console.warn(message);
    },
  },
});
```

## 推荐目录结构

```txt
src/
  services/
    request.ts        # 创建业务请求实例
    modules/
      user.ts         # 用户接口
      order.ts        # 订单接口
```

示例：

```ts
// services/request.ts
import { createHttpClient } from "@bc/http-request";

export const request = createHttpClient({
  baseURL: "/api",
});
```

```ts
// services/modules/user.ts
import { request } from "../request";

export type User = {
  id: string;
  name: string;
};

export const getUserApi = request.define.get<{ id: string }, User>("/users/detail");
export const updateUserApi = request.define.post<Partial<User>, User>("/users/update");
```

业务模块建议只暴露语义化函数，不直接把 axios 配置散落到页面里。

## API 参考

### `createHttpClient(options?)`

创建 `HttpClient` 实例。

```ts
const request = createHttpClient(options);
```

### `HttpOptions`

| 配置          | 类型                                   | 默认值                       | 说明                         |
| ------------- | -------------------------------------- | ---------------------------- | ---------------------------- |
| `baseURL`     | `string`                               | `undefined`                  | 请求基础地址，透传给 axios。 |
| `timeout`     | `number`                               | `15000`                      | 请求超时时间，单位毫秒。     |
| `headers`     | `Record<string, string>`               | `undefined`                  | 全局默认请求头。             |
| `axiosConfig` | `AxiosRequestConfig`                   | `undefined`                  | 原生 axios 配置。            |
| `auth`        | `AuthAdapter`                          | `{}`                         | 认证适配器。                 |
| `response`    | `ResponseAdapter`                      | 默认协议适配器               | 后端响应协议适配器。         |
| `retry`       | `Partial<RetryOptions>`                | `{ retries: 0, delay: 300 }` | 全局失败重试策略。           |
| `duplicate`   | `boolean \| Partial<DuplicateOptions>` | `false`                      | 重复请求取消策略。           |
| `platform`    | `PlatformAdapter`                      | `{}`                         | 平台能力适配器。             |
| `plugins`     | `HttpPlugin[]`                         | `[]`                         | 插件列表。                   |

### `AuthAdapter`

| 配置            | 类型                                           | 说明                                   |
| --------------- | ---------------------------------------------- | -------------------------------------- |
| `headerName`    | `string`                                       | token 请求头名，默认 `Authorization`。 |
| `tokenPrefix`   | `string`                                       | token 前缀，例如 `Bearer`。            |
| `getToken`      | `() => Awaitable<string \| null \| undefined>` | 读取 token。                           |
| `refreshToken`  | `() => Awaitable<string \| null \| undefined>` | 刷新 token，并返回新 token。           |
| `clearToken`    | `() => Awaitable<void>`                        | 清理登录态。                           |
| `shouldRefresh` | `(error: HttpError) => boolean`                | 判断错误是否需要刷新 token。           |
| `onAuthExpired` | `(error: HttpError) => Awaitable<void>`        | 登录态过期回调。                       |

### `PlatformAdapter`

| 配置              | 类型                                                                 | 说明                       |
| ----------------- | -------------------------------------------------------------------- | -------------------------- |
| `toast`           | `(message: string, error: HttpError) => void`                        | 全局错误提示。             |
| `showLoading`     | `() => void`                                                         | 显示全局 loading。         |
| `hideLoading`     | `() => void`                                                         | 隐藏全局 loading。         |
| `redirectToLogin` | `(error: HttpError) => void`                                         | 跳转登录页。               |
| `getExtraHeaders` | `(config) => Awaitable<Record<string, string> \| null \| undefined>` | 每次请求前动态追加请求头。 |

### `ResponseAdapter`

| 配置         | 类型                                                 | 说明               |
| ------------ | ---------------------------------------------------- | ------------------ |
| `isSuccess`  | `(body, response) => boolean`                        | 判断业务是否成功。 |
| `getData`    | `<T>(body, response) => T`                           | 提取业务数据。     |
| `getMessage` | `(body, response?) => string`                        | 提取错误文案。     |
| `getCode`    | `(body, response?) => string \| number \| undefined` | 提取业务错误码。   |

### `RetryOptions`

| 配置          | 类型                            | 说明                     |
| ------------- | ------------------------------- | ------------------------ |
| `retries`     | `number`                        | 最大重试次数。           |
| `delay`       | `number`                        | 每次重试前等待的毫秒数。 |
| `shouldRetry` | `(error: HttpError) => boolean` | 判断错误是否需要重试。   |

### `DuplicateOptions`

| 配置          | 类型                 | 说明                   |
| ------------- | -------------------- | ---------------------- |
| `enabled`     | `boolean`            | 是否开启重复请求取消。 |
| `keyResolver` | `(config) => string` | 生成重复请求 key。     |

### `HttpPlugin`

| 配置    | 类型                                   | 说明           |
| ------- | -------------------------------------- | -------------- |
| `name`  | `string`                               | 插件名称。     |
| `setup` | `(context: HttpPluginContext) => void` | 插件安装函数。 |

### 导出的类型

```ts
export { createHttpClient, HttpClient, HttpError, HttpRequestDefiner };

export type {
  ApiEnvelope,
  AuthAdapter,
  DefinedRequest,
  DuplicateOptions,
  HttpOptions,
  HttpPlugin,
  HttpPluginContext,
  PlatformAdapter,
  RequestConfig,
  ResponseAdapter,
  RetryOptions,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
};
```
