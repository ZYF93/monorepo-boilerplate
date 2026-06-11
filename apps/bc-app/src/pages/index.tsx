import { type FC } from "react";

export const Page: FC = () => {
  return (
    <micro-app
      name="order-portal"
      url={import.meta.env.PUBLIC_MICRO_APP_ORDER_PORTAL_URL}
      data={{
        containerTop: 50,
      }}
    />
  );
};
