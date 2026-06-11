import type { FormValidator, PasswordRuleOptions } from "./types.ts";

export type {
  FormValidator,
  PasswordRuleOptions,
  ValidatorCallback,
  ValidatorRule,
} from "./types.ts";

const PHONE_RE = /^1[3-9]\d{9}$/;
const ID_CARD_RE = /^(\d{15}|\d{17}[\dXx])$/;
const NORMAL_INPUT_RE = /^[\w\u4e00-\u9fa5\-\s]+$/u;

export function isPhone(value: unknown): boolean {
  return typeof value === "string" && PHONE_RE.test(value.trim());
}

export function isIdCard(value: unknown): boolean {
  if (typeof value !== "string" || !ID_CARD_RE.test(value.trim())) {
    return false;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized.length !== 18) {
    return true;
  }

  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checks = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = factors.reduce(
    (total, factor, index) => total + Number(normalized[index]) * factor,
    0,
  );

  return checks[sum % 11] === normalized.at(-1);
}

export function isPassword(value: unknown, options: PasswordRuleOptions = {}): boolean {
  const { minLength = 8, maxLength = 20, requireLetter = true, requireNumber = true } = options;

  if (typeof value !== "string" || value.length < minLength || value.length > maxLength) {
    return false;
  }

  if (requireLetter && !/[A-Za-z]/.test(value)) {
    return false;
  }

  if (requireNumber && !/\d/.test(value)) {
    return false;
  }

  return true;
}

export function isNormalInput(value: unknown): boolean {
  return typeof value === "string" && NORMAL_INPUT_RE.test(value.trim());
}

export function validatorPhone(message = "请输入正确的手机号"): FormValidator {
  return createValidator(isPhone, message);
}

export function validatorPassword(
  message = "请输入正确的密码",
  options?: PasswordRuleOptions,
): FormValidator {
  return createValidator((value) => isPassword(value, options), message);
}

export function validatorNormalInput(message = "请输入正确的内容"): FormValidator {
  return createValidator(isNormalInput, message);
}

export function validatorIdCard(message = "请输入正确的身份证号"): FormValidator {
  return createValidator(isIdCard, message);
}

function createValidator(predicate: (value: unknown) => boolean, message: string): FormValidator {
  return (_rule, value, callback) => {
    if (value === null || value === undefined || value === "" || predicate(value)) {
      callback?.();
      return Promise.resolve();
    }

    callback?.(message);
    return Promise.reject(new Error(message));
  };
}
