export type ValidatorRule = unknown;

export type ValidatorCallback = (error?: string) => void;

export type FormValidator = (
  rule: ValidatorRule,
  value: unknown,
  callback?: ValidatorCallback,
) => Promise<void> | void;

export interface PasswordRuleOptions {
  minLength?: number;
  maxLength?: number;
  requireLetter?: boolean;
  requireNumber?: boolean;
}
