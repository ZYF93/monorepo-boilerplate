import { Sys } from "@bc/router/components";
import type { FC } from "react";

export class System extends Sys {
  LoadingComponent: FC = () => <div />;

  reportError(e: Error): Promise<unknown> {
    // TODO: 接入项目错误上报
    console.error(e);
    return Promise.resolve();
  }

  checkAuth(): boolean | Promise<boolean> {
    // TODO: 接入项目登录态检查
    return true;
  }

  checkPermission(permission: string): boolean | Promise<boolean> {
    // TODO: 接入项目权限检查
    console.log(permission);
    return true;
  }
}
