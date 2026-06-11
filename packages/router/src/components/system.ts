import { inject, provide } from "@e7w/easy-model";
import type { FC } from "react";
import zod from "zod";

import type { Meta } from "../type";

export abstract class Sys {
  abstract LoadingComponent: FC;
  abstract reportError(e: Error): Promise<unknown>;
  abstract checkAuth(): boolean | Promise<boolean>;
  abstract checkPermission(permission: string): boolean | Promise<boolean>;
}

export const SysSchema: zod.ZodType<Sys, Sys> = zod
  .any()
  // .object({
  //   checkAuth: zod.function({
  //     output: zod.boolean(),
  //   }),
  //   checkPermission: zod.function({
  //     output: zod.boolean(),
  //   }),
  //   reportError: zod.function({
  //     input: zod.any(),
  //     output: zod.promise(zod.any()),
  //   }),
  //   LoadingComponent: zod.function({
  //     input: [zod.object()],
  //     output: zod.any(),
  //   }), // TODO: 不知道怎么声明 FC
  // })
  .describe("检查登录与权限");

class System {
  @inject(SysSchema)
  sys?: Sys;

  async checkAuth(meta?: Meta) {
    if (meta?.skipAuth) return true;
    return this.sys?.checkAuth();
  }

  async checkPermission(permission: string, meta?: Meta) {
    if (meta?.skipPermission) return true;
    return this.sys?.checkPermission(permission);
  }

  reportError<T>(error: T) {
    const e = typeof error === "string" ? new Error(error) : (error as Error);
    return this.sys?.reportError(e);
  }
}

export const system = provide(System)();
