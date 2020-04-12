import { Glue42Core } from "../../../glue";

/** Server info used on client side */
export interface ServerInfo {
    id: string;
    info: Glue42Core.AGM.Instance; // TODO - THIS IS PASSED FROM CLIENT AND IS INSTANCE + SOME MORE INFO
    methods: { [name: string]: ClientMethodInfo };
    getInfoForUser: () => Glue42Core.AGM.Instance;
}

/** Method info used on client side */
export interface ClientMethodInfo {
    id: string;
    info: Glue42Core.AGM.MethodDefinition;
    getInfoForUser: () => Glue42Core.AGM.MethodDefinition;
    protocolState: ClientMethodInfoProtocolState;
}

export interface ClientMethodInfoProtocolState {
    id?: string; // GW3 id
}

/** Methods per server */
export interface ServerMethodsPair {
    server: ServerInfo;
    methods?: ClientMethodInfo[];
}
