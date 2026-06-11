import type { FC } from "react";
import { Link, Outlet } from "react-router";
import { menu } from "virtual:bc-router";

const Menu: FC<{ items: (typeof menu)[] }> = ({ items }) => {
  return (
    <>
      {items.map((item, i) => {
        if (!item.display) return null;
        return (
          <div key={i}>
            <Link to={item.path}>{item.name}</Link>
            {item.children && <Menu items={item.children} />}
          </div>
        );
      })}
    </>
  );
};

export const Layout: FC = () => {
  return (
    <div>
      <Menu items={[menu]} />
      <Outlet />
    </div>
  );
};
