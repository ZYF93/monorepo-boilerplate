declare module "virtual:bc-router" {
  import type { Menu } from "@bc/router/components";
  import type { RouteObject } from "react-router";

  export const routes: RouteObject[];
  export const menu: Menu;
}
