/* eslint-disable @typescript-eslint/no-explicit-any */
import { Glue42Core } from "@glue42/core";

export type LayoutSummary = { name: string; context: any; metadata: any };
export type LayoutsAPI = {
    getAll(type: "Workspace"): Promise<LayoutSummary[]>;
    remove(type: "Workspace", name: string): Promise<void>;
    export(layoutType?: "Workspace"): Promise<any[]>;
    import(layout: any): Promise<void>;
};

export type InvocationResult<T> = Glue42Core.Interop.InvocationResult<T>;
export type InteropAPI = Glue42Core.Interop.API;
export type GDWindow = {
    id: string;
    close(): Promise<GDWindow>;
    moveTo(config: { top: number; left: number }): Promise<void>;
    resizeTo(config: { width: number; height: number }): Promise<void>;
    moveResize(config: Bounds): Promise<void>;
};
export type Subscription = Glue42Core.Interop.Subscription;
export type WindowsAPI = { list(): GDWindow[]; my(): GDWindow; open(name: string, url: string, options?: any): Promise<GDWindow> };
export type Instance = Glue42Core.Interop.Instance;
export type Bounds = { height?: number; width?: number; top?: number; left?: number };