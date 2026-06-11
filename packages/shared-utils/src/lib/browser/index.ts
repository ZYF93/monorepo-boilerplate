import type {
  BrowserCompatibilityReport,
  BrowserCompatibilityResult,
  BrowserCompatibilityTargets,
  BrowserInfo,
  BrowserName,
  BrowserPlatform,
  CheckBrowserCompatibilityOptions,
} from "./types.ts";

export type {
  BrowserCompatibilityFailure,
  BrowserCompatibilityReason,
  BrowserCompatibilityReport,
  BrowserCompatibilityResult,
  BrowserCompatibilityTargets,
  BrowserEngine,
  BrowserInfo,
  BrowserName,
  BrowserPlatform,
  CheckBrowserCompatibilityOptions,
} from "./types.ts";

export const DEFAULT_BROWSER_COMPATIBILITY_TARGETS: BrowserCompatibilityTargets = {
  androidBrowser: 5,
  androidChrome: 51,
  chrome: 109,
  edge: 109,
  iosSafari: 10,
  wechatAndroid: 51,
  wechatIos: 10,
};

export function detectBrowser(userAgent = getRuntimeUserAgent()): BrowserInfo {
  const normalizedUserAgent = userAgent.trim();
  const platform = detectPlatform(normalizedUserAgent);
  const isWechat = /MicroMessenger/i.test(normalizedUserAgent);
  const isMobile = platform === "android" || platform === "ios";
  const isWebView = detectWebView(normalizedUserAgent, platform, isWechat);

  if (isWechat && platform === "android") {
    const version = matchVersion(normalizedUserAgent, /(?:Chrome|CriOS)\/(\d+(?:\.\d+)*)/i);

    return createBrowserInfo({
      engine: "chromium",
      isMobile,
      isWebView: true,
      name: "wechat_android",
      platform,
      userAgent: normalizedUserAgent,
      version,
    });
  }

  if (isWechat && platform === "ios") {
    const version = matchIosVersion(normalizedUserAgent);

    return createBrowserInfo({
      engine: "webkit",
      isMobile,
      isWebView: true,
      name: "wechat_ios",
      platform,
      userAgent: normalizedUserAgent,
      version,
    });
  }

  const edgeVersion = matchVersion(normalizedUserAgent, /(?:EdgA?|EdgiOS)\/(\d+(?:\.\d+)*)/i);
  if (edgeVersion) {
    const version = platform === "ios" ? matchIosVersion(normalizedUserAgent) : edgeVersion;

    return createBrowserInfo({
      engine: platform === "ios" ? "webkit" : "chromium",
      isMobile,
      isWebView,
      name: "edge",
      platform,
      userAgent: normalizedUserAgent,
      version,
    });
  }

  const chromeVersion = matchVersion(normalizedUserAgent, /Chrome\/(\d+(?:\.\d+)*)/i);
  if (chromeVersion && !/OPR\//i.test(normalizedUserAgent)) {
    return createBrowserInfo({
      engine: "chromium",
      isMobile,
      isWebView,
      name: "chrome",
      platform,
      userAgent: normalizedUserAgent,
      version: chromeVersion,
    });
  }

  const firefoxVersion = matchVersion(normalizedUserAgent, /Firefox\/(\d+(?:\.\d+)*)/i);
  if (firefoxVersion) {
    return createBrowserInfo({
      engine: "gecko",
      isMobile,
      isWebView,
      name: "firefox",
      platform,
      userAgent: normalizedUserAgent,
      version: firefoxVersion,
    });
  }

  if (platform === "ios" && /Safari\//i.test(normalizedUserAgent)) {
    const version =
      matchVersion(normalizedUserAgent, /Version\/(\d+(?:\.\d+)*)/i) ??
      matchIosVersion(normalizedUserAgent);

    return createBrowserInfo({
      engine: "webkit",
      isMobile,
      isWebView,
      name: "ios_safari",
      platform,
      userAgent: normalizedUserAgent,
      version,
    });
  }

  const androidBrowserVersion = matchVersion(
    normalizedUserAgent,
    /Version\/(\d+(?:\.\d+)*).*Mobile Safari\//i,
  );
  if (platform === "android" && androidBrowserVersion) {
    return createBrowserInfo({
      engine: "webkit",
      isMobile,
      isWebView,
      name: "android_browser",
      platform,
      userAgent: normalizedUserAgent,
      version: androidBrowserVersion,
    });
  }

  const safariVersion = matchVersion(normalizedUserAgent, /Version\/(\d+(?:\.\d+)*).*Safari\//i);
  if (platform !== "android" && safariVersion) {
    return createBrowserInfo({
      engine: "webkit",
      isMobile,
      isWebView,
      name: "safari",
      platform,
      userAgent: normalizedUserAgent,
      version: safariVersion,
    });
  }

  return createBrowserInfo({
    engine: "unknown",
    isMobile,
    isWebView,
    name: "unknown",
    platform,
    userAgent: normalizedUserAgent,
  });
}

export function checkBrowserCompatibility(
  options: CheckBrowserCompatibilityOptions = {},
): BrowserCompatibilityResult {
  const browser = detectBrowser(options.userAgent);
  const targets = {
    ...DEFAULT_BROWSER_COMPATIBILITY_TARGETS,
    ...options.targets,
  };
  const requiredVersion = getRequiredVersion(browser, targets);

  if (requiredVersion === undefined) {
    const isUnknownBrowser = browser.name === "unknown";
    const compatible = isUnknownBrowser
      ? options.allowUnknown === true
      : options.allowUntargeted !== false;

    return {
      browser,
      compatible,
      failures: compatible
        ? []
        : [
            {
              browserName: browser.name,
              browserMajorVersion: browser.majorVersion,
              browserVersion: browser.version,
              message: "当前浏览器不在兼容目标列表中。",
              reason: isUnknownBrowser ? "unknown_browser" : "browser_not_targeted",
            },
          ],
    };
  }

  if (browser.majorVersion === undefined) {
    return {
      browser,
      compatible: false,
      failures: [
        {
          browserName: browser.name,
          browserVersion: browser.version,
          message: "无法识别当前浏览器版本。",
          reason: "unknown_version",
          requiredVersion,
        },
      ],
    };
  }

  if (browser.majorVersion < requiredVersion) {
    return {
      browser,
      compatible: false,
      failures: [
        {
          browserName: browser.name,
          browserMajorVersion: browser.majorVersion,
          browserVersion: browser.version,
          message: `当前浏览器版本过低，最低需要 ${requiredVersion}。`,
          reason: "version_below_target",
          requiredVersion,
        },
      ],
    };
  }

  return {
    browser,
    compatible: true,
    failures: [],
  };
}

export function createBrowserCompatibilityReport(
  result: BrowserCompatibilityResult,
): BrowserCompatibilityReport {
  const failure = result.failures[0];

  return {
    browserMajorVersion: result.browser.majorVersion,
    browserName: result.browser.name,
    browserVersion: result.browser.version,
    compatible: result.compatible,
    engine: result.browser.engine,
    isMobile: result.browser.isMobile,
    isWebView: result.browser.isWebView,
    platform: result.browser.platform,
    reason: failure?.reason ?? "compatible",
    requiredVersion: failure?.requiredVersion,
    userAgent: result.browser.userAgent,
  };
}

export function getBrowserUpgradeMessage(result: BrowserCompatibilityResult): string {
  if (result.compatible) {
    return "当前浏览器版本符合访问要求。";
  }

  const browserLabel = getBrowserLabel(result.browser.name);
  const version = result.browser.version ? ` ${result.browser.version}` : "";
  const requiredVersion = result.failures[0]?.requiredVersion;

  if (requiredVersion !== undefined) {
    return `当前 ${browserLabel}${version} 版本过低，请升级到 ${requiredVersion} 或更高版本后重试。`;
  }

  return `当前 ${browserLabel}${version} 暂不支持访问，请升级浏览器或更换现代浏览器后重试。`;
}

function createBrowserInfo(info: Omit<BrowserInfo, "majorVersion">): BrowserInfo {
  return {
    ...info,
    majorVersion: parseMajorVersion(info.version),
  };
}

function detectPlatform(userAgent: string): BrowserPlatform {
  if (/Android/i.test(userAgent)) {
    return "android";
  }

  if (/(iPhone|iPad|iPod)/i.test(userAgent)) {
    return "ios";
  }

  if (userAgent) {
    return "pc";
  }

  return "unknown";
}

function detectWebView(userAgent: string, platform: BrowserPlatform, isWechat: boolean): boolean {
  if (isWechat) {
    return true;
  }

  if (platform === "ios") {
    return !/Safari\//i.test(userAgent) || !/Version\//i.test(userAgent);
  }

  if (platform === "android") {
    return /; wv\)/i.test(userAgent) || /Version\/\d+(?:\.\d+)* Chrome\//i.test(userAgent);
  }

  return false;
}

function getRequiredVersion(
  browser: BrowserInfo,
  targets: BrowserCompatibilityTargets,
): number | undefined {
  switch (browser.name) {
    case "android_browser": {
      return targets.androidBrowser;
    }
    case "chrome": {
      return browser.platform === "android"
        ? (targets.androidChrome ?? targets.chrome)
        : targets.chrome;
    }
    case "edge": {
      if (browser.platform === "android") {
        return targets.androidChrome ?? targets.edge;
      }

      return browser.platform === "ios" ? (targets.iosSafari ?? targets.edge) : targets.edge;
    }
    case "firefox": {
      return targets.firefox;
    }
    case "ios_safari": {
      return targets.iosSafari;
    }
    case "safari": {
      return targets.safari;
    }
    case "wechat_android": {
      return targets.wechatAndroid ?? targets.androidChrome;
    }
    case "wechat_ios": {
      return targets.wechatIos ?? targets.iosSafari;
    }
    default: {
      return undefined;
    }
  }
}

function getBrowserLabel(name: BrowserName): string {
  switch (name) {
    case "android_browser": {
      return "Android 浏览器";
    }
    case "chrome": {
      return "Chrome";
    }
    case "edge": {
      return "Edge";
    }
    case "firefox": {
      return "Firefox";
    }
    case "ios_safari": {
      return "iOS Safari";
    }
    case "safari": {
      return "Safari";
    }
    case "wechat_android": {
      return "微信 Android WebView";
    }
    case "wechat_ios": {
      return "微信 iOS WebView";
    }
    default: {
      return "浏览器";
    }
  }
}

function getRuntimeUserAgent(): string {
  if (typeof navigator === "undefined") {
    return "";
  }

  return navigator.userAgent;
}

function matchVersion(userAgent: string, pattern: RegExp): string | undefined {
  return pattern.exec(userAgent)?.[1];
}

function matchIosVersion(userAgent: string): string | undefined {
  return matchVersion(userAgent, /OS (\d+(?:_\d+)*) like Mac OS X/i)?.replace(/_/g, ".");
}

function parseMajorVersion(version: string | undefined): number | undefined {
  if (!version) {
    return undefined;
  }

  const majorVersion = Number.parseInt(version, 10);

  return Number.isNaN(majorVersion) ? undefined : majorVersion;
}
