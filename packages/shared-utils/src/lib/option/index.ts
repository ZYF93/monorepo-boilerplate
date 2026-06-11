import type { OptionInput, OptionItem } from "./types.ts";

export type { OptionInput, OptionItem } from "./types.ts";

export class Options<Value extends string | number = string | number> {
  readonly list: OptionItem<Value>[];

  constructor(options: OptionInput<Value>[]) {
    this.list = options.map(normalizeOption);
  }

  getLabel(value: Value): string | undefined {
    return this.list.find((item) => item.value === value)?.label;
  }

  getValue(label: string): Value | undefined {
    return this.list.find((item) => item.label === label)?.value;
  }

  toMap(): Map<Value, string> {
    return new Map(this.list.map((item) => [item.value, item.label]));
  }
}

export function defineOptions<Value extends string | number>(
  options: OptionInput<Value>[],
): Options<Value> {
  return new Options(options);
}

export function getOptionLabel<Value extends string | number>(
  options: OptionItem<Value>[],
  value: Value,
): string | undefined {
  return options.find((item) => item.value === value)?.label;
}

function normalizeOption<Value extends string | number>(
  option: OptionInput<Value>,
): OptionItem<Value> {
  if (isOptionTuple(option)) {
    const [value, label] = option;
    return { label, value };
  }

  return option;
}

function isOptionTuple<Value extends string | number>(
  option: OptionInput<Value>,
): option is readonly [Value, string] {
  return Array.isArray(option);
}
