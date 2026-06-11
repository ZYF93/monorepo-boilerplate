import { Sys } from "@bc/router/components";
import type { FC } from "react";

export class System extends Sys {
  LoadingComponent: FC = () => <div></div>; // TODO: 这里是 Fallback 和 loading 组件
  reportError(e: Error): Promise<unknown> {
    // TODO: 这里是上报页面错误的
    console.error(e);
    // throw new Error("Method not implemented.");
    return Promise.resolve();
  }
  checkAuth(): boolean | Promise<boolean> {
    // TODO: 这里是检查登录状态的
    console.log("Method not implemented.");
    return true;
  }
  checkPermission(permission: string): boolean | Promise<boolean> {
    // TODO: 这里是检查权限的
    console.log(permission);
    return true;
  }
}
