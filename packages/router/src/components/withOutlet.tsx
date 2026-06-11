import type { FC } from "react";
import { Outlet, useMatches } from "react-router";

export function withOutlet(Component: FC, cp: string) {
  return () => {
    const matches = useMatches();
    const cur = matches.at(-1)?.handle as { isAction: boolean };
    const parent = matches.at(-3)?.handle as { path: string };
    if (!cur?.isAction || parent.path !== cp) return <Component />;
    return (
      <>
        <Component />
        <Outlet />
      </>
    );
  };
}
