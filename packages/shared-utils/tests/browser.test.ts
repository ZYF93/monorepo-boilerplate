import { expect, test } from "vite-plus/test";

import {
  checkBrowserCompatibility,
  createBrowserCompatibilityReport,
  detectBrowser,
  getBrowserUpgradeMessage,
} from "../src/lib/browser/index.ts";

const chrome109Ua =
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

const chrome80Ua =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36";

const firefox120Ua =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0";

const androidEdge80Ua =
  "Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36 EdgA/80.0.361.62";

const androidStockBrowser4Ua =
  "Mozilla/5.0 (Linux; U; Android 4.0.3; en-us; Galaxy Nexus Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30";

const iosSafari10Ua =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E277 Safari/602.1";

const iosChromeUa =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/80.0.3987.95 Mobile/15E148 Safari/604.1";

const iosEdgeUa =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/80.0 Mobile/15E148 Safari/605.1.15";

const ios9EdgeUa =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 9_3 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) EdgiOS/80.0 Mobile/13E233 Safari/601.1";

const wechatAndroidUa =
  "Mozilla/5.0 (Linux; Android 8.1.0; Pixel Build/OPM1) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044807 Mobile Safari/537.36 MicroMessenger/7.0.20";

const unknownBrowserUa =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 CustomBrowser/1.0";

const iosSafariWithoutVersionUa =
  "Mozilla/5.0 (iPhone; CPU iPhone like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Mobile/14E277 Safari/602.1";

const wechatAndroidWithoutChromeUa =
  "Mozilla/5.0 (Linux; Android 8.1.0; Pixel Build/OPM1) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 MQQBrowser/6.2 TBS/044807 Mobile Safari/537.36 MicroMessenger/7.0.20";

test("detects Windows Chrome 109", () => {
  const browser = detectBrowser(chrome109Ua);

  expect(browser.name).toBe("chrome");
  expect(browser.majorVersion).toBe(109);
  expect(browser.platform).toBe("pc");
  expect(browser.engine).toBe("chromium");
  expect(browser.isWebView).toBe(false);
});

test("checks Chrome version against PC target", () => {
  const result = checkBrowserCompatibility({ userAgent: chrome80Ua });

  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("version_below_target");
  expect(result.failures[0]?.requiredVersion).toBe(109);
  expect(getBrowserUpgradeMessage(result)).toContain("109");
});

test("checks Android Edge against Android Chromium baseline", () => {
  const result = checkBrowserCompatibility({ userAgent: androidEdge80Ua });

  expect(result.browser.name).toBe("edge");
  expect(result.browser.platform).toBe("android");
  expect(result.browser.majorVersion).toBe(80);
  expect(result.compatible).toBe(true);
  expect(result.failures).toHaveLength(0);
});

test("detects Android stock browser before generic Safari", () => {
  const result = checkBrowserCompatibility({ userAgent: androidStockBrowser4Ua });

  expect(result.browser.name).toBe("android_browser");
  expect(result.browser.platform).toBe("android");
  expect(result.browser.majorVersion).toBe(4);
  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("version_below_target");
  expect(result.failures[0]?.requiredVersion).toBe(5);
});

test("accepts iOS Safari 10 for ES2015 mobile target", () => {
  const result = checkBrowserCompatibility({ userAgent: iosSafari10Ua });

  expect(result.browser.name).toBe("ios_safari");
  expect(result.browser.majorVersion).toBe(10);
  expect(result.compatible).toBe(true);
});

test("treats iOS Chrome as iOS WebKit baseline", () => {
  const result = checkBrowserCompatibility({ userAgent: iosChromeUa });

  expect(result.browser.name).toBe("ios_safari");
  expect(result.browser.majorVersion).toBe(12);
  expect(result.compatible).toBe(true);
});

test("detects iOS Edge and uses WebKit engine", () => {
  const result = checkBrowserCompatibility({ userAgent: iosEdgeUa });

  expect(result.browser.name).toBe("edge");
  expect(result.browser.version).toBe("12.5");
  expect(result.browser.majorVersion).toBe(12);
  expect(result.browser.platform).toBe("ios");
  expect(result.browser.engine).toBe("webkit");
  expect(result.compatible).toBe(true);
  expect(result.failures).toHaveLength(0);
});

test("checks iOS Edge compatibility by iOS WebKit version instead of app version", () => {
  const result = checkBrowserCompatibility({ userAgent: ios9EdgeUa });

  expect(result.browser.name).toBe("edge");
  expect(result.browser.version).toBe("9.3");
  expect(result.browser.majorVersion).toBe(9);
  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("version_below_target");
  expect(result.failures[0]?.requiredVersion).toBe(10);
});

test("detects WeChat Android WebView by Chromium version", () => {
  const result = checkBrowserCompatibility({ userAgent: wechatAndroidUa });

  expect(result.browser.name).toBe("wechat_android");
  expect(result.browser.majorVersion).toBe(66);
  expect(result.browser.isWebView).toBe(true);
  expect(result.compatible).toBe(true);
});

test("creates report payload for incompatible browser logs", () => {
  const result = checkBrowserCompatibility({ userAgent: chrome80Ua });
  const report = createBrowserCompatibilityReport(result);

  expect(report.compatible).toBe(false);
  expect(report.reason).toBe("version_below_target");
  expect(report.browserName).toBe("chrome");
  expect(report.browserMajorVersion).toBe(80);
  expect(report.requiredVersion).toBe(109);
});

test("blocks unknown browser by default", () => {
  const result = checkBrowserCompatibility({ userAgent: "" });

  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("unknown_browser");
});

test("explicit allowUnknown false keeps the default unknown browser behavior", () => {
  const result = checkBrowserCompatibility({ allowUnknown: false, userAgent: "" });

  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("unknown_browser");
});

test("allows recognized untargeted browser by default", () => {
  const result = checkBrowserCompatibility({ userAgent: firefox120Ua });

  expect(result.browser.name).toBe("firefox");
  expect(result.compatible).toBe(true);
  expect(result.failures).toHaveLength(0);
});

test("blocks recognized untargeted browser when configured", () => {
  const result = checkBrowserCompatibility({ allowUntargeted: false, userAgent: firefox120Ua });

  expect(result.browser.name).toBe("firefox");
  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("browser_not_targeted");
});

test("reports unknown browser when UA has no supported browser token", () => {
  const result = checkBrowserCompatibility({ userAgent: unknownBrowserUa });
  const report = createBrowserCompatibilityReport(result);

  expect(result.browser.name).toBe("unknown");
  expect(result.browser.platform).toBe("pc");
  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("unknown_browser");
  expect(report.reason).toBe("unknown_browser");
  expect(report.browserVersion).toBeUndefined();
});

test("reports unknown version when iOS Safari UA misses version tokens", () => {
  const result = checkBrowserCompatibility({ userAgent: iosSafariWithoutVersionUa });
  const report = createBrowserCompatibilityReport(result);

  expect(result.browser.name).toBe("ios_safari");
  expect(result.browser.majorVersion).toBeUndefined();
  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("unknown_version");
  expect(result.failures[0]?.requiredVersion).toBe(10);
  expect(report.reason).toBe("unknown_version");
});

test("reports unknown version when WeChat Android UA misses Chromium version", () => {
  const result = checkBrowserCompatibility({ userAgent: wechatAndroidWithoutChromeUa });

  expect(result.browser.name).toBe("wechat_android");
  expect(result.browser.isWebView).toBe(true);
  expect(result.browser.majorVersion).toBeUndefined();
  expect(result.compatible).toBe(false);
  expect(result.failures[0]?.reason).toBe("unknown_version");
  expect(result.failures[0]?.requiredVersion).toBe(51);
});

test("allows unknown browser when explicitly configured", () => {
  const result = checkBrowserCompatibility({ allowUnknown: true, userAgent: "xxxx" });

  expect(result.compatible).toBe(true);
  expect(result.failures).toHaveLength(0);
});
