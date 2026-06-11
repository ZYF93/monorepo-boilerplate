import { type FC } from "react";
import { Outlet } from "react-router";

export const Layout: FC = () => (
  <>
    <Outlet />
  </>
);
