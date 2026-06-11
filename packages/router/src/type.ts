export type Menu = {
  name: string;
  icon?: string;
  path: string;
  display: boolean;
  children?: Menu[];
  permission?: string;
};

type Data = Record<string, string | number>;

export type Req = {
  params: Data;
  query: Data;
  pathname: string;
};

export type Loader = (req: Req) => unknown;

export type Meta = {
  skipAuth?: boolean;
  skipPermission?: boolean;
  loader?<T>(): T | Promise<T>;
  name?: string;
  displayInMenu?: boolean;
  icon?: string;
  permission?: string;
};
