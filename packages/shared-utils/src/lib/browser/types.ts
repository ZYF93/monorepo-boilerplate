export type BrowserName =
  | "android_browser"
  | "chrome"
  | "edge"
  | "firefox"
  | "ios_safari"
  | "safari"
  | "wechat_android"
  | "wechat_ios"
  | "unknown";

export type BrowserPlatform = "android" | "ios" | "pc" | "unknown";

export type BrowserEngine = "chromium" | "gecko" | "unknown" | "webkit";

export interface BrowserInfo {
  name: BrowserName;
  version?: string;
  majorVersion?: number;
  platform: BrowserPlatform;
  engine: BrowserEngine;
  isMobile: boolean;
  isWebView: boolean;
  userAgent: string;
}

export interface BrowserCompatibilityTargets {
  androidBrowser?: number;
  androidChrome?: number;
  chrome?: number;
  edge?: number;
  firefox?: number;
  iosSafari?: number;
  safari?: number;
  wechatAndroid?: number;
  wechatIos?: number;
}

export type BrowserCompatibilityReason =
  | "browser_not_targeted"
  | "compatible"
  | "unknown_browser"
  | "unknown_version"
  | "version_below_target";

export interface BrowserCompatibilityFailure {
  reason: BrowserCompatibilityReason;
  browserName: BrowserName;
  browserVersion?: string;
  browserMajorVersion?: number;
  requiredVersion?: number;
  message: string;
}

export interface BrowserCompatibilityResult {
  browser: BrowserInfo;
  compatible: boolean;
  failures: BrowserCompatibilityFailure[];
}

export interface CheckBrowserCompatibilityOptions {
  userAgent?: string;
  targets?: BrowserCompatibilityTargets;
  allowUnknown?: boolean;
  allowUntargeted?: boolean;
}

export interface BrowserCompatibilityReport {
  compatible: boolean;
  reason: BrowserCompatibilityReason;
  browserName: BrowserName;
  browserVersion?: string;
  browserMajorVersion?: number;
  requiredVersion?: number;
  platform: BrowserPlatform;
  engine: BrowserEngine;
  isMobile: boolean;
  isWebView: boolean;
  userAgent: string;
}
