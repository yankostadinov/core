import { IoC } from "./shared/ioc";
import { composeAPI } from "./main";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async (glue: any): Promise<void> => {

    const ioc = new IoC(glue.agm, glue.windows, glue.layouts);

    await ioc.initiate();

    glue.workspaces = composeAPI(glue, ioc);
};
