# @bc/shared-utils

BC 前端公共工具函数包。当前按能力模块提供子路径入口，业务项目按需导入对应模块。

## 入口

```ts
import { jsonParse } from "@bc/shared-utils/json";
import { defineOptions } from "@bc/shared-utils/option";
import { isPhone, validatorPhone } from "@bc/shared-utils/validator";
import { checkBrowserCompatibility } from "@bc/shared-utils/browser";
```

当前公开入口：

| 入口                         | 职责                          |
| ---------------------------- | ----------------------------- |
| `@bc/shared-utils/browser`   | 浏览器识别、兼容目标判断      |
| `@bc/shared-utils/json`      | 安全 JSON 解析、序列化、克隆  |
| `@bc/shared-utils/option`    | 枚举/选项列表定义、查找、映射 |
| `@bc/shared-utils/validator` | 纯校验函数、表单校验器        |

## Browser 工具

用于在应用入口前置识别浏览器版本，判断是否满足项目兼容目标，并生成错误上报字段。适合 C 端 H5、App WebView、微信/支付宝内页面、B 端 PC 管理后台等需要在首屏前友好提示用户升级浏览器的场景。

典型使用场景：

| 场景                    | 用法                                                                       |
| ----------------------- | -------------------------------------------------------------------------- |
| C 端首屏前置拦截        | 在应用入口最早执行 `checkBrowserCompatibility()`，不兼容时展示升级提示页。 |
| B 端 PC 兼容兜底        | 使用默认 `chrome: 109` / `edge: 109` 目标，拦截低版本 PC 浏览器。          |
| App / 微信 WebView 排查 | 使用 `detectBrowser()` 获取平台、WebView、内核和版本信息。                 |
| 不兼容日志上报          | 使用 `createBrowserCompatibilityReport()` 生成标准上报字段。               |
| 低风险页面观察未知 UA   | 设置 `allowUnknown: true` 放行未知 UA，同时配合错误上报观察。              |

导入：

```ts
import {
  checkBrowserCompatibility,
  createBrowserCompatibilityReport,
  detectBrowser,
  getBrowserUpgradeMessage,
} from "@bc/shared-utils/browser";
```

默认兼容目标：

| 目标             | 默认最低版本 | 说明                                                    |
| ---------------- | ------------ | ------------------------------------------------------- |
| `chrome`         | `109`        | PC Chrome，兼容 Windows 7 最后可用 Chrome 主版本。      |
| `edge`           | `109`        | PC Edge Chromium。                                      |
| `androidChrome`  | `51`         | C 端 Android Chrome / Chromium WebView 的 ES2015 基线。 |
| `iosSafari`      | `10`         | C 端 iOS Safari 的 ES2015 基线。                        |
| `wechatAndroid`  | `51`         | 微信 Android WebView，默认按 Chromium 内核版本判断。    |
| `wechatIos`      | `10`         | 微信 iOS WebView，默认按 iOS WebKit 版本判断。          |
| `androidBrowser` | `5`          | Android 原生浏览器，默认仅做保守识别。                  |

### 前置拦截示例

建议在 React、路由和业务初始化之前执行：

```ts
import {
  checkBrowserCompatibility,
  createBrowserCompatibilityReport,
  getBrowserUpgradeMessage,
} from "@bc/shared-utils/browser";

const result = checkBrowserCompatibility();

if (!result.compatible) {
  window.__APP_REPORT__?.track("browser_incompatible", createBrowserCompatibilityReport(result));

  renderUpgradeBrowserPage({
    message: getBrowserUpgradeMessage(result),
  });
} else {
  bootstrapApp();
}
```

### `detectBrowser(userAgent?)`

识别浏览器名称、版本、平台、内核和 WebView 信息。未传 `userAgent` 时会读取运行时 `navigator.userAgent`。

参数：

| 参数        | 类型     | 默认值                | 说明                                                      |
| ----------- | -------- | --------------------- | --------------------------------------------------------- |
| `userAgent` | `string` | `navigator.userAgent` | 可选。传入后会基于该 UA 解析；不传时读取当前运行环境 UA。 |

返回值 `BrowserInfo`：

| 字段           | 类型                | 说明                                                                   |
| -------------- | ------------------- | ---------------------------------------------------------------------- |
| `name`         | `BrowserName`       | 浏览器名称，例如 `chrome`、`ios_safari`、`wechat_android`、`unknown`。 |
| `version`      | `string\|undefined` | 完整版本号，无法识别时为 `undefined`。                                 |
| `majorVersion` | `number\|undefined` | 主版本号，无法识别时为 `undefined`。                                   |
| `platform`     | `BrowserPlatform`   | `pc`、`ios`、`android` 或 `unknown`。                                  |
| `engine`       | `BrowserEngine`     | `chromium`、`webkit`、`gecko` 或 `unknown`。                           |
| `isMobile`     | `boolean`           | 是否移动端环境。                                                       |
| `isWebView`    | `boolean`           | 是否识别为 WebView 或 App 内置浏览器。                                 |
| `userAgent`    | `string`            | 参与识别的原始 UA。                                                    |

```ts
const browser = detectBrowser();

browser.name; // "chrome" | "ios_safari" | "wechat_android" | ...
browser.majorVersion; // 109
browser.platform; // "pc" | "ios" | "android" | "unknown"
```

支持识别的浏览器名称：

```txt
android_browser
chrome
edge
firefox
ios_safari
safari
wechat_android
wechat_ios
unknown
```

### `checkBrowserCompatibility(options?)`

按项目默认目标判断浏览器是否兼容。默认目标包含 PC Chrome 109、Edge 109、C 端 Android Chrome 51、iOS Safari 10、微信 WebView 对应基线。

参数：

| 参数                      | 类型                          | 默认值                | 说明                                                       |
| ------------------------- | ----------------------------- | --------------------- | ---------------------------------------------------------- |
| `options.userAgent`       | `string`                      | `navigator.userAgent` | 可选。用于测试、服务端预判或手动传入 UA。                  |
| `options.targets`         | `BrowserCompatibilityTargets` | 项目默认兼容目标      | 可选。覆盖默认最低版本目标。                               |
| `options.allowUnknown`    | `boolean`                     | `false`               | 可选。是否允许未知浏览器通过兼容检查。                     |
| `options.allowUntargeted` | `boolean`                     | `true`                | 可选。是否允许已识别但未配置目标版本的浏览器通过兼容检查。 |

`targets` 支持字段：

| 字段             | 类型     | 说明                                             |
| ---------------- | -------- | ------------------------------------------------ |
| `androidBrowser` | `number` | Android 原生浏览器最低主版本。                   |
| `androidChrome`  | `number` | Android Chrome / Chromium WebView 最低主版本。   |
| `chrome`         | `number` | PC Chrome 最低主版本。                           |
| `edge`           | `number` | Edge Chromium 最低主版本。                       |
| `firefox`        | `number` | Firefox 最低主版本；未配置时不作为强目标。       |
| `iosSafari`      | `number` | iOS Safari 最低主版本。                          |
| `safari`         | `number` | macOS Safari 最低主版本；未配置时不作为强目标。  |
| `wechatAndroid`  | `number` | 微信 Android WebView 最低 Chromium 主版本。      |
| `wechatIos`      | `number` | 微信 iOS WebView 最低 iOS Safari/WebKit 主版本。 |

返回值 `BrowserCompatibilityResult`：

| 字段         | 类型                            | 说明                             |
| ------------ | ------------------------------- | -------------------------------- |
| `browser`    | `BrowserInfo`                   | 浏览器识别结果。                 |
| `compatible` | `boolean`                       | 是否满足兼容目标。               |
| `failures`   | `BrowserCompatibilityFailure[]` | 不兼容原因列表，兼容时为空数组。 |

`failures[].reason` 取值：

| 值                     | 说明                               |
| ---------------------- | ---------------------------------- |
| `version_below_target` | 浏览器版本低于目标版本。           |
| `unknown_browser`      | 无法识别浏览器类型。               |
| `unknown_version`      | 识别到浏览器类型，但无法识别版本。 |
| `browser_not_targeted` | 浏览器类型不在目标列表中。         |

默认情况下未知 UA 会被判定为不兼容：

```ts
const result = checkBrowserCompatibility({ userAgent: "" });

result.compatible; // false
result.failures[0]?.reason; // "unknown_browser"
```

低风险页面可以显式放行未知 UA：

```ts
const result = checkBrowserCompatibility({
  allowUnknown: true,
});
```

已识别但未配置目标版本的浏览器默认放行，例如未配置 `firefox` 时 Firefox 会通过兼容检查，便于观察非主目标浏览器。需要强制拦截时可设置：

```ts
const result = checkBrowserCompatibility({
  allowUntargeted: false,
});
```

```ts
const result = checkBrowserCompatibility();

if (!result.compatible) {
  showUpgradeBrowserPage(getBrowserUpgradeMessage(result));
}
```

也可以按应用覆盖目标：

```ts
const result = checkBrowserCompatibility({
  targets: {
    androidChrome: 60,
    chrome: 109,
    iosSafari: 12,
  },
});
```

### `createBrowserCompatibilityReport(result)`

生成适合错误上报的标准字段。

参数：

| 参数     | 类型                         | 说明                                     |
| -------- | ---------------------------- | ---------------------------------------- |
| `result` | `BrowserCompatibilityResult` | `checkBrowserCompatibility()` 的返回值。 |

返回值 `BrowserCompatibilityReport`：

| 字段                  | 类型                         | 说明                       |
| --------------------- | ---------------------------- | -------------------------- |
| `compatible`          | `boolean`                    | 是否通过兼容检查。         |
| `reason`              | `BrowserCompatibilityReason` | 兼容或不兼容原因。         |
| `browserName`         | `BrowserName`                | 浏览器名称。               |
| `browserVersion`      | `string\|undefined`          | 浏览器完整版本。           |
| `browserMajorVersion` | `number\|undefined`          | 浏览器主版本。             |
| `requiredVersion`     | `number\|undefined`          | 不兼容时要求的最低主版本。 |
| `platform`            | `BrowserPlatform`            | 平台。                     |
| `engine`              | `BrowserEngine`              | 浏览器内核。               |
| `isMobile`            | `boolean`                    | 是否移动端。               |
| `isWebView`           | `boolean`                    | 是否 WebView。             |
| `userAgent`           | `string`                     | 原始 UA。                  |

```ts
const result = checkBrowserCompatibility();

if (!result.compatible) {
  window.__APP_REPORT__?.track("browser_incompatible", createBrowserCompatibilityReport(result));
}
```

### `getBrowserUpgradeMessage(result)`

根据兼容检查结果生成用户提示文案。

参数：

| 参数     | 类型                         | 说明                                     |
| -------- | ---------------------------- | ---------------------------------------- |
| `result` | `BrowserCompatibilityResult` | `checkBrowserCompatibility()` 的返回值。 |

返回值：`string`。

```ts
const result = checkBrowserCompatibility();
const message = getBrowserUpgradeMessage(result);

// "当前 Chrome 80.0.3987.149 版本过低，请升级到 109 或更高版本后重试。"
```

## JSON 工具

导入：

```ts
import { jsonClone, jsonParse, toJson } from "@bc/shared-utils/json";
```

### `jsonParse(value, options?)`

安全解析 JSON 字符串。解析成功返回解析后的值，解析失败返回 `options.fallback`；未传 fallback 时返回 `undefined`。

```ts
const data = jsonParse<{ name: string }>(`{"name":"bc"}`);
// data: { name: "bc" }

const fallback = jsonParse("broken", { fallback: { name: "default" } });
// fallback: { name: "default" }
```

### `toJson(value, options?)`

安全序列化任意值。序列化成功返回 JSON 字符串，失败返回空字符串。`options.space` 可用于格式化缩进。

```ts
toJson({ ok: true });
// '{"ok":true}'

toJson({ ok: true }, { space: 2 });
// '{\n  "ok": true\n}'
```

### `jsonClone(value)`

基于 JSON 序列化进行简单深拷贝。适用于普通 JSON 数据，不适合包含函数、`Date`、`Map`、循环引用等复杂结构的数据。

```ts
const source = { user: { name: "bc" } };
const cloned = jsonClone(source);

cloned.user.name = "changed";
source.user.name; // "bc"
```

## Option 工具

导入：

```ts
import { Options, defineOptions, getOptionLabel } from "@bc/shared-utils/option";
```

### `defineOptions(options)`

定义一组选项，并返回 `Options` 实例。支持对象形式和元组形式。

```ts
const statusOptions = defineOptions([
  [1, "启用"],
  [0, "停用"],
]);

statusOptions.list;
// [{ value: 1, label: "启用" }, { value: 0, label: "停用" }]
```

对象形式：

```ts
const userTypeOptions = defineOptions([
  { value: "admin", label: "管理员" },
  { value: "user", label: "普通用户", disabled: true },
]);
```

### `Options`

选项集合类，通常通过 `defineOptions` 创建，也可以直接 `new Options(options)`。

#### `options.list`

标准化后的选项数组。

```ts
const options = defineOptions([[1, "启用"]]);

options.list;
// [{ value: 1, label: "启用" }]
```

#### `options.getLabel(value)`

根据 `value` 查找对应 `label`，找不到返回 `undefined`。

```ts
const options = defineOptions([[1, "启用"]]);

options.getLabel(1); // "启用"
options.getLabel(2); // undefined
```

#### `options.getValue(label)`

根据 `label` 查找对应 `value`，找不到返回 `undefined`。

```ts
const options = defineOptions([[1, "启用"]]);

options.getValue("启用"); // 1
options.getValue("未知"); // undefined
```

#### `options.toMap()`

转换为 `Map<value, label>`，适合频繁查找 label 的场景。

```ts
const options = defineOptions([
  [1, "启用"],
  [0, "停用"],
]);

const statusMap = options.toMap();
statusMap.get(1); // "启用"
```

### `getOptionLabel(options, value)`

直接从标准选项数组中查找 label。

```ts
const options = [
  { value: 1, label: "启用" },
  { value: 0, label: "停用" },
];

getOptionLabel(options, 1); // "启用"
```

## Validator 工具

导入：

```ts
import {
  isIdCard,
  isNormalInput,
  isPassword,
  isPhone,
  validatorIdCard,
  validatorNormalInput,
  validatorPassword,
  validatorPhone,
} from "@bc/shared-utils/validator";
```

`validator` 模块分两层：

| 类型       | 返回值          | 使用场景               |
| ---------- | --------------- | ---------------------- |
| 纯校验函数 | `boolean`       | 普通业务逻辑判断       |
| 表单校验器 | `FormValidator` | 表单 `rules.validator` |

表单校验器只负责“格式校验”，`null`、`undefined`、`""` 会直接通过。必填请在业务表单中单独配置 `required`。

```ts
const rules = [{ required: true, message: "请输入手机号" }, { validator: validatorPhone() }];
```

### `isPhone(value)`

校验中国大陆手机号。规则：`1` 开头，第二位为 `3-9`，共 11 位。

```ts
isPhone("13800138000"); // true
isPhone("12800138000"); // false
isPhone(13800138000); // false
```

### `isIdCard(value)`

校验身份证号。支持 15 位和 18 位；18 位会校验最后一位校验码，`x` 会按 `X` 处理。

```ts
isIdCard("11010519491231002X"); // true
isIdCard("11010519491231002x"); // true
isIdCard("110105194912310021"); // false
```

### `isPassword(value, options?)`

校验密码。默认规则：长度 `8-20`，必须包含字母，必须包含数字。

```ts
isPassword("abc12345"); // true
isPassword("abcdefgh"); // false，没有数字
isPassword("12345678"); // false，没有字母
```

可通过 `PasswordRuleOptions` 调整规则：

| 参数            | 默认值 | 说明             |
| --------------- | ------ | ---------------- |
| `minLength`     | `8`    | 最小长度         |
| `maxLength`     | `20`   | 最大长度         |
| `requireLetter` | `true` | 是否必须包含字母 |
| `requireNumber` | `true` | 是否必须包含数字 |

```ts
isPassword("abcdef", { minLength: 6, requireNumber: false }); // true
isPassword("123456", { minLength: 6, requireLetter: false }); // true
```

### `isNormalInput(value)`

校验普通文本输入。当前允许中文、英文字母、数字、下划线、中横线和空格。

```ts
isNormalInput("张三-abc_123"); // true
isNormalInput("张三 abc_123"); // true
isNormalInput("张三@abc"); // false
```

### `validatorPhone(message?)`

创建手机号表单校验器。

```ts
const rules = [{ validator: validatorPhone() }];

const customRules = [{ validator: validatorPhone("手机号格式不正确") }];
```

### `validatorIdCard(message?)`

创建身份证号表单校验器。

```ts
const rules = [{ validator: validatorIdCard() }];

const customRules = [{ validator: validatorIdCard("身份证号格式不正确") }];
```

### `validatorPassword(message?, options?)`

创建密码表单校验器。`options` 与 `isPassword` 的规则参数一致。

```ts
const rules = [{ validator: validatorPassword() }];

const looseRules = [
  {
    validator: validatorPassword("请输入至少 6 位密码", {
      minLength: 6,
      requireNumber: false,
    }),
  },
];
```

### `validatorNormalInput(message?)`

创建普通文本输入表单校验器。

```ts
const rules = [{ validator: validatorNormalInput() }];

const customRules = [
  {
    validator: validatorNormalInput("只允许中文、字母、数字、空格、下划线和中横线"),
  },
];
```

### 表单校验器返回值

表单校验器支持 Promise 和 callback 两种调用方式。

```ts
const validator = validatorPhone("手机号格式不正确");

await validator(null, "13800138000");

validator(null, "123", (error) => {
  console.log(error); // "手机号格式不正确"
});
```
