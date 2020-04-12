import { Glue42Core} from "../../../glue";
import ServerStream from "./stream";

export interface ServerSubscriptionInfo {

    branchKey: string;
    arguments: object;
    instance: Glue42Core.AGM.Instance;
    streamId: string;

    // GW3 only
    id?: string;
    subscribeMsg?: object;

    // GW1 only
    privateEventStreamSubject?: string;
    methodResponseSubject?: string;
}

export interface ServerMethodInfo {
    definition: Glue42Core.AGM.MethodDefinition;
    protocolState: {
        method?: any; // GW1 thing , we should remove
        globalEventStreamSubject?: string; // GW1
        subscriptions?: ServerSubscriptionInfo[]; // GW1
        branchKeyToStreamIdMap?: Array<{ key: string, streamId: string }> // GW1, GW3
        subscriptionsMap?: { [id: string]: ServerSubscriptionInfo }; // GW3
    };
    repoId?: string;
    theFunction?: WrappedCallbackFunction;
    streamCallbacks?: Glue42Core.AGM.StreamOptions;
    stream?: ServerStream;
}

export interface ResultContext {
    args: object;
    instance: Glue42Core.AGM.Instance;
}

export interface WrappedCallbackFunction {
    (context: ResultContext, resultCallback: (err: string, result: object) => void): void;
    userCallback?: (args: object, caller: Glue42Core.AGM.Instance) => object;
    userCallbackAsync?: (args: object, caller: Glue42Core.AGM.Instance, successCallback: (args?: object) => void, errorCallback: (error?: string | object) => void) => void;
}

export interface RequestContext {
    msg: any;
    arguments: object;
    instance: Glue42Core.AGM.Instance;
}
