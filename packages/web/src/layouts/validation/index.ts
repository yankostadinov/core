import { Decoder, oneOf, constant, string, object, optional, anyJson, boolean, array } from "decoder-validate";
import { Glue42Web } from "../../../web";
import { WorkspaceComponent } from "@glue42/workspaces-api";
import { workspaceComponentDecoder } from "./workspace";
import { windowComponentDecoder } from "./window";

export const nonEmptyStringDecoder: Decoder<string> = string().where((s) => s.length > 0, "Expected a non-empty string");

export const layoutTypeDecoder: Decoder<Glue42Web.Layouts.LayoutType> = oneOf<Glue42Web.Layouts.LayoutType>(
    constant("Global"),
    constant("Workspace"),
);

export const newLayoutOptionsDecoder: Decoder<Glue42Web.Layouts.NewLayoutOptions> = object({
    name: nonEmptyStringDecoder,
    context: optional(anyJson()),
    metadata: optional(anyJson())
});

export const restoreOptionsDecoder: Decoder<Glue42Web.Layouts.RestoreOptions> = object({
    name: nonEmptyStringDecoder,
    context: optional(anyJson()),
    closeRunningInstance: optional(boolean())
});

export const layoutDecoder: Decoder<Glue42Web.Layouts.Layout> = object({
    name: nonEmptyStringDecoder,
    type: layoutTypeDecoder,
    context: optional(anyJson()),
    metadata: optional(anyJson()),
    components: array(oneOf<WorkspaceComponent | Glue42Web.Layouts.WindowComponent>(
        workspaceComponentDecoder,
        windowComponentDecoder
    ))
});
