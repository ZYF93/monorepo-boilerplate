import type { FC } from "react";
import { Outlet } from "react-router";

export const Layout: FC = () => {
  return (
    <div>
      no-menu
      <Outlet />
    </div>
  );
};
