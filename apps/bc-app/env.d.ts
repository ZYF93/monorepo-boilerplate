/// <reference types="@bc/router/env" />

import type React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "micro-app": React.HTMLAttributes<HTMLElement> & {
        name: string;
        url: string;
        data?: Record<string, unknown>;
        baseroute?: string;
        disableSandbox?: boolean | string;
        iframe?: boolean | string;
      };
    }
  }
}
