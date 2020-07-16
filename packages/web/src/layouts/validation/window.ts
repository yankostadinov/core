import { Decoder, object, constant, optional, anyJson, boolean } from "decoder-validate";
import { nonEmptyStringDecoder } from ".";
import { Glue42Web } from "../../../web";

export const windowComponentDecoder: Decoder<Glue42Web.Layouts.WindowComponent> = object({
    type: constant("window"),
    componentType: constant("application"),
    state: object({
        name: anyJson(),
        context: anyJson(),
        url: nonEmptyStringDecoder,
        bounds: anyJson(),
        id: nonEmptyStringDecoder,
        parentId: optional(nonEmptyStringDecoder),
        main: boolean()
    })
});
