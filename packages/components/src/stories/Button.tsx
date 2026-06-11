import type { FC, PropsWithChildren } from "react";

export const Button: FC<PropsWithChildren<{ onClick: () => void }>> = ({ onClick, children }) => {
  return (
    <button type="button" className="bg-blue-500" onClick={onClick}>
      {children}
    </button>
  );
};
