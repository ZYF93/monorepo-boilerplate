import { expect, test } from "vite-plus/test";

import {
  isIdCard,
  isNormalInput,
  isPassword,
  isPhone,
  validatorIdCard,
  validatorNormalInput,
  validatorPassword,
  validatorPhone,
} from "../src/lib/validator/index.ts";

test("validates phone numbers", () => {
  expect(isPhone("13800138000")).toBe(true);
  expect(isPhone(" 13800138000 ")).toBe(true);
  expect(isPhone("12800138000")).toBe(false);
  expect(isPhone("1380013800")).toBe(false);
  expect(isPhone(13800138000)).toBe(false);
});

test("validates id cards", () => {
  expect(isIdCard("11010519491231002X")).toBe(true);
  expect(isIdCard("11010519491231002x")).toBe(true);
  expect(isIdCard("110105194912310021")).toBe(false);
  expect(isIdCard("110105491231002")).toBe(true);
  expect(isIdCard("abc")).toBe(false);
});

test("validates passwords with default and custom rules", () => {
  expect(isPassword("abc12345")).toBe(true);
  expect(isPassword("abcdefgh")).toBe(false);
  expect(isPassword("12345678")).toBe(false);
  expect(isPassword("abc123")).toBe(false);
  expect(isPassword("abc123456789012345678")).toBe(false);
  expect(isPassword("abcdef", { minLength: 6, requireNumber: false })).toBe(true);
  expect(isPassword("123456", { minLength: 6, requireLetter: false })).toBe(true);
});

test("validates normal input", () => {
  expect(isNormalInput("张三-abc_123")).toBe(true);
  expect(isNormalInput("张三 abc_123")).toBe(true);
  expect(isNormalInput("张三@abc")).toBe(false);
  expect(isNormalInput(123)).toBe(false);
});

test("allows empty values in form validators", async () => {
  await expect(validatorPhone()(null, null)).resolves.toBeUndefined();
  await expect(validatorPhone()(null, undefined)).resolves.toBeUndefined();
  await expect(validatorPhone()(null, "")).resolves.toBeUndefined();
});

test("wraps phone validators for promise-based form usage", async () => {
  await expect(validatorPhone()(null, "13800138000")).resolves.toBeUndefined();
  await expect(validatorPhone()(null, "123")).rejects.toThrow("请输入正确的手机号");
  await expect(validatorPhone("手机号格式不正确")(null, "123")).rejects.toThrow("手机号格式不正确");
});

test("wraps id card, password, and normal input validators", async () => {
  await expect(validatorIdCard()(null, "11010519491231002X")).resolves.toBeUndefined();
  await expect(validatorIdCard()(null, "110105194912310021")).rejects.toThrow(
    "请输入正确的身份证号",
  );

  await expect(
    validatorPassword(undefined, { minLength: 6 })(null, "abc123"),
  ).resolves.toBeUndefined();
  await expect(validatorPassword()(null, "abcdefg")).rejects.toThrow("请输入正确的密码");

  await expect(validatorNormalInput()(null, "张三-abc_123")).resolves.toBeUndefined();
  await expect(validatorNormalInput()(null, "张三@abc")).rejects.toThrow("请输入正确的内容");
});

test("supports callback-style form usage", async () => {
  const errors: Array<string | undefined> = [];

  await Promise.resolve(
    validatorPhone("手机号格式不正确")(null, "123", (error) => {
      errors.push(error);
    }),
  ).catch(() => undefined);

  await validatorPhone()(null, "13800138000", (error) => {
    errors.push(error);
  });

  expect(errors).toEqual(["手机号格式不正确", undefined]);
});
