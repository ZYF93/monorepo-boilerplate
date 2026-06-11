import { SysSchema } from "@bc/router/components";
import { CInjection, config, Container } from "@e7w/easy-model";

import { System } from "./system";

config(
  <Container>
    <CInjection schema={SysSchema} ctor={System} />
  </Container>,
);
