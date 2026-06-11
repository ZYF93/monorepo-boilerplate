import { useInstance } from "@e7w/easy-model";
import { type FC, type PropsWithChildren, useEffect, useState } from "react";
import { Link, useNavigate, useRouteError } from "react-router";

import { system } from "./system";

export const ErrorBoundary: FC<PropsWithChildren> = ({ children }) => {
  const nav = useNavigate();
  const error = useRouteError();
  const [s, setS] = useState(3);
  const { reportError } = useInstance(system);
  useEffect(() => {
    void reportError(error);
    const timer = setInterval(() => {
      setS((prev) => {
        if (prev === 0) void nav("/", { replace: true });
        return Math.max(prev - 1, 0);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [nav, reportError, error]);
  if (!error) return <>{children}</>;
  return (
    <div
      style={{
        textAlign: "center",
        padding: "24px",
      }}
    >
      出错啦, {s}s 后将为您跳转到
      <Link to="/" replace>
        首页
      </Link>
    </div>
  );
};
