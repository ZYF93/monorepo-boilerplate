import type { FC } from "react";
import { Navigate } from "react-router";

export const NavTo404: FC = () => {
  return <Navigate to="/404" replace />;
};
