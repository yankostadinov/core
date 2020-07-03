import { Glue42 } from "@glue42/desktop";
import { Glue42Core } from "@glue42/core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LayoutSummary = { name: string; context: any; metadata: any };
export type LayoutsAPI = {
    getAll(type: "Workspace"): Promise<LayoutSummary[]>;
    remove(type: "Workspace", name: string): Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export(layoutType?: "Workspace"): Promise<any[]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import(layout: any): Promise<void>;
};

export type InvocationResult<T> = Glue42Core.Interop.InvocationResult<T>;
export type InteropAPI = Glue42Core.Interop.API;
export type GDWindow = Glue42.Windows.GDWindow;
export type Subscription = Glue42Core.Interop.Subscription;
export type WindowsAPI = Glue42.Windows.API;
export type Instance = Glue42.AGM.Instance;