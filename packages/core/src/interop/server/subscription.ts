import { Protocol } from "../types";
import { Glue42Core } from "../../../glue";

import { WrappedCallbackFunction, ResultContext, ServerMethodInfo, ServerSubscriptionInfo } from "./types";

export default class ServerSubscription implements Glue42Core.AGM.StreamSubscription {

    constructor(private protocol: Protocol, private repoMethod: ServerMethodInfo, private subscription: ServerSubscriptionInfo) {
    }

    public get stream(): Glue42Core.AGM.Stream { return this.repoMethod.stream; }
    public get arguments() { return this.subscription.arguments || {}; }
    public get branchKey(): string { return this.subscription.branchKey; }
    public get instance(): Glue42Core.AGM.Instance { return this.subscription.instance; }

    public close() {
        this.protocol.server.closeSingleSubscription(this.repoMethod, this.subscription);
    }

    public push(data: object) {
        this.protocol.server.pushDataToSingle(this.repoMethod, this.subscription, data);
    }
}
