export interface OptionItem<Value extends string | number = string | number> {
  label: string;
  value: Value;
  disabled?: boolean;
}

export type OptionInput<Value extends string | number = string | number> =
  | OptionItem<Value>
  | readonly [Value, string];
