export type Nullable<T> = T | null | undefined;

export type Dictionary<T = unknown> = Record<string, T>;

export type Primitive = string | number | boolean | bigint | symbol | null | undefined;
