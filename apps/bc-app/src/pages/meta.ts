import type { Loader } from "@bc/router/components";

export const name = "首页";

export const loader: Loader = () => {
  return "hello";
};

export const permission = "xxx";

export const displayInMenu = true;
