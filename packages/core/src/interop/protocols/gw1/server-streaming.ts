import generate from "shortid";
import { convertInstance, convertInfoToInstance } from "./helpers";
import { ServerMethodInfo, ServerSubscriptionInfo, RequestContext } from "../../server/types";
import { Glue42Core } from "../../../../glue";

export default class ServerStreaming {
    private requestHandler: (rc: RequestContext, method: ServerMethodInfo) => void;
    private subAddedHandler: (subscription: ServerSubscriptionInfo, streamingMethod: ServerMethodInfo) => void;
    private subRemovedHandler: (subscriber: ServerSubscriptionInfo, repoMethod: ServerMethodInfo) => void;

    constructor(private connection: Glue42Core.Connection.API, private instance: Glue42Core.AGM.Instance) {
    }

    public isStreamMsg(msg: any, method: ServerMethodInfo) {
        return (msg &&
            msg.EventStreamAction &&
            msg.EventStreamAction !== 0 &&
            typeof method === "object" &&
            method.definition.supportsStreaming === true
        );
    }

    public pushData(streamingMethod: ServerMethodInfo, data: object, branches: string[]) {
        if (typeof streamingMethod !== "object" || !Array.isArray(streamingMethod.protocolState.branchKeyToStreamIdMap)) {
            return;
        }

        // TODO validate data is a plain object
        if (typeof data !== "object") {
            throw new Error("Invalid arguments. Data must be an object.");
        }

        if (typeof branches === "string") {
            branches = [branches]; // user wants to push to single branch
        } else if (!Array.isArray(branches) || branches.length <= 0) {
            branches = null;
        }

        // get the StreamId's from the method's branch map
        const streamIdList = streamingMethod.protocolState.branchKeyToStreamIdMap
            .filter((br) => {
                return (
                    branches === null || (Boolean(br) && typeof br.key === "string" && branches.indexOf(br.key) >= 0)
                );
            }).map((br) => {
                return br.streamId;
            });

        const server = convertInstance(this.instance);
        streamIdList.forEach((streamId) => {

            this.sendResult({
                EventStreamAction: 5,
                EventStreamSubject: streamingMethod.protocolState.globalEventStreamSubject,
                MethodName: streamingMethod.protocolState.method.Method.Name,
                MethodRequestSubject: streamingMethod.protocolState.method.MethodRequestSubject,
                ResultContextJson: data,
                Server: server,
                StreamId: streamId,
            });
        });
    }

    public closeAllSubscriptions(streamingMethod: ServerMethodInfo, branchKey?: string) {
        if (typeof streamingMethod !== "object" || !Array.isArray(streamingMethod.protocolState.branchKeyToStreamIdMap)) {
            return;
        }

        let streamList = streamingMethod.protocolState.branchKeyToStreamIdMap;

        if (typeof branchKey === "string") {
            streamList = streamingMethod.protocolState.branchKeyToStreamIdMap.filter((br) => {
                return (typeof br === "object" && br.key === branchKey);
            });
        }

        // TODO: consider getting the unique branch keys from 'live subscribers'

        streamList.forEach((br) => {
            const streamId = br.streamId;

            this.sendResult({
                EventStreamAction: 2,
                EventStreamSubject: streamingMethod.protocolState.globalEventStreamSubject,
                MethodName: streamingMethod.protocolState.method.Method.Name,
                MethodRequestSubject: streamingMethod.protocolState.method.MethodRequestSubject,
                Server: convertInstance(this.instance),
                StreamId: streamId,
                Status: 0,
            });
        });
    }

    public getBranchList(streamingMethod: ServerMethodInfo): string[] {
        if (typeof streamingMethod !== "object") {
            return [];
        }

        return this.getUniqueBranchNames(streamingMethod);

        // TODO the agm-api passes each sub to protocol methods for creating the sub front obj
    }

    public getSubscriptionList(streamingMethod: ServerMethodInfo, branchKey?: string): ServerSubscriptionInfo[] {
        if (typeof streamingMethod !== "object") {
            return [];
        }

        let subscriptions: ServerSubscriptionInfo[] = [];

        if (typeof branchKey !== "string") {
            subscriptions = streamingMethod.protocolState.subscriptions;
        } else {
            subscriptions = streamingMethod.protocolState.subscriptions.filter((sub) => {
                return sub.branchKey === branchKey;
            });
        }

        return subscriptions;
    }

    public onSubAdded(handlerFunc: (subscription: ServerSubscriptionInfo, repoMethod: ServerMethodInfo) => void) {
        if (typeof handlerFunc !== "function") {
            return;
        }

        this.subAddedHandler = handlerFunc;
    }

    public onSubRemoved(handlerFunc: (subscriber: ServerSubscriptionInfo, repoMethod: ServerMethodInfo) => void) {
        if (typeof handlerFunc !== "function") {
            return;
        }

        this.subRemovedHandler = handlerFunc;
    }

    public onSubRequest(handlerFunc: (requestContext: RequestContext, repoMethod: ServerMethodInfo) => void) {
        if (typeof handlerFunc !== "function") {
            return;
        }

        this.requestHandler = handlerFunc;
    }

    public generateNewStreamId(streamingMethodName: string): string {
        const appInfo = convertInstance(this.instance);

        return "streamId-jsb_of_" +
            streamingMethodName +
            "__by_" +
            appInfo.ApplicationName +
            "_" +
            generate();
    }

    public rejectRequest(requestContext: RequestContext, streamingMethod: ServerMethodInfo, reason: string) {
        if (typeof reason !== "string") {
            reason = "";
        }

        const msg = requestContext.msg;

        this.sendResult({
            EventStreamAction: 2,
            EventStreamSubject: streamingMethod.protocolState.globalEventStreamSubject,
            // InvocationId: msg.Context.InvocationId,
            MethodName: streamingMethod.protocolState.method.Method.Name,
            MethodRequestSubject: streamingMethod.protocolState.method.MethodRequestSubject,
            MethodResponseSubject: msg.MethodResponseSubject,
            MethodVersion: streamingMethod.protocolState.method.Method.Version,
            ResultMessage: reason,
            Server: convertInstance(this.instance),
            StreamId: "default_rejection_streamId",
        });
    }

    public pushDataToSingle(streamingMethod: ServerMethodInfo, subscription: ServerSubscriptionInfo, data: object) {

        // TODO validate data is a plain object
        if (typeof data !== "object") {
            throw new Error("Invalid arguments. Data must be an object.");
        }

        this.sendResult({
            EventStreamAction: 5,
            EventStreamSubject: subscription.privateEventStreamSubject,
            MethodName: streamingMethod.protocolState.method.Method.Name,
            MethodRequestSubject: streamingMethod.protocolState.method.MethodRequestSubject,
            ResultContextJson: data,
            Server: convertInstance(this.instance),
            StreamId: subscription.streamId,
        });
    }

    public closeSingleSubscription(streamingMethod: ServerMethodInfo, subscription: ServerSubscriptionInfo) {
        this.closeIndividualSubscription(
            streamingMethod,
            subscription.streamId,
            subscription.privateEventStreamSubject,
            true,
        );
    }

    /** (request) Methods */
    public acceptRequestOnBranch(requestContext: RequestContext, streamingMethod: ServerMethodInfo, branch: string) {
        if (typeof branch !== "string") {
            branch = "";
        }

        const streamId = this.getStreamId(streamingMethod, branch);

        const msg = requestContext.msg;

        this.sendResult({
            EventStreamAction: 3,
            EventStreamSubject: streamingMethod.protocolState.globalEventStreamSubject,
            InvocationId: msg.Context.InvocationId,
            MethodName: streamingMethod.protocolState.method.Method.Name,
            MethodRequestSubject: streamingMethod.protocolState.method.MethodRequestSubject,
            MethodResponseSubject: msg.MethodResponseSubject,
            MethodVersion: streamingMethod.protocolState.method.Method.Version,
            ResultMessage: "Accepted",
            Server: convertInstance(this.instance),
            StreamId: streamId,
        });
    }

    public processSubscriberMsg(msg: any, streamingMethod: ServerMethodInfo) {
        if (!(msg && msg.EventStreamAction && msg.EventStreamAction !== 0)) {
            return;
        }

        if (msg.EventStreamAction === 1) {
            this.clientWishesToSubscribe(msg, streamingMethod);

        } else if (msg.EventStreamAction === 2) {
            this.clientWishesToUnsubscribe(msg, streamingMethod);

        } else if (msg.EventStreamAction === 3) {
            this.clientAcknowledgesItDidSubscribe(msg, streamingMethod);

        } else if (msg.EventStreamAction === 4) {
            this.clientPerSubHeartbeat(msg);
        }
    }

    private sendResult(message: any) {
        if (typeof message !== "object") {
            throw new Error("Invalid message.");
        }

        if (typeof message.Status !== "number") {
            message.Status = 0;
        }

        this.connection.send("agm", "MethodInvocationResultMessage", message);
    }

    /** msg 'Request' Actions */
    // action 1
    private clientWishesToSubscribe(msg: any, streamingMethod: ServerMethodInfo) {

        const requestContext: RequestContext = {
            msg,
            arguments: msg.Context.ArgumentsJson || {},
            instance: convertInfoToInstance(msg.Client),
        };

        if (typeof this.requestHandler === "function") {
            this.requestHandler(requestContext, streamingMethod);
        }
    }

    // action 2
    private clientWishesToUnsubscribe(msg: any, streamingMethod: ServerMethodInfo) {

        if (!(streamingMethod &&
            Array.isArray(streamingMethod.protocolState.subscriptions) &&
            streamingMethod.protocolState.subscriptions.length > 0)
        ) {
            return;
        }

        this.closeIndividualSubscription(streamingMethod, msg.StreamId, msg.EventStreamSubject, false);
    }

    // action 3
    private clientAcknowledgesItDidSubscribe(msg: any, streamingMethod: ServerMethodInfo) {
        // Client indicates it is listening to a specific StreamId

        if (typeof msg.StreamId !== "string" || msg.StreamId === "") {
            return;
        }

        const branchKey = this.getBranchKey(streamingMethod, msg.StreamId);

        if (typeof branchKey !== "string") {
            return;
        }

        if (!Array.isArray(streamingMethod.protocolState.subscriptions)) {
            return;
        }

        const subscription: ServerSubscriptionInfo = {
            branchKey,
            instance: convertInfoToInstance(msg.Client),
            arguments: msg.Context.ArgumentsJson,
            streamId: msg.StreamId,
            privateEventStreamSubject: msg.EventStreamSubject,
            methodResponseSubject: msg.MethodResponseSubject,
        };

        // Subscription back-obj is stored
        streamingMethod.protocolState.subscriptions.push(subscription);

        if (typeof this.subAddedHandler === "function") {
            this.subAddedHandler(subscription, streamingMethod);
        }
    }

    // action 4
    private clientPerSubHeartbeat(msg: any) {
        // A client may have multiple subscriptions, each one having its own heartbeat
        // Currently not implemented by the GW or the client
    }

    private getBranchKey(streamingMethod: ServerMethodInfo, streamId: string): string {
        if (typeof streamId !== "string" || typeof streamingMethod !== "object") {
            return;
        }

        const needle = streamingMethod.protocolState.branchKeyToStreamIdMap.filter((branch) => {
            return branch.streamId === streamId;
        })[0];

        if (typeof needle !== "object" || typeof needle.key !== "string") {
            return;
        }

        return needle.key;
    }

    private getStreamId(streamingMethod: ServerMethodInfo, branchKey: string): string {
        if (typeof branchKey !== "string") {
            branchKey = "";
        }

        const needleBranch = streamingMethod.protocolState.branchKeyToStreamIdMap.filter((branch) => {
            return branch.key === branchKey;
        })[0];

        let streamId = (needleBranch ? needleBranch.streamId : undefined);

        if (typeof streamId !== "string" || streamId === "") {
            streamId = this.generateNewStreamId(streamingMethod.protocolState.method.Method.Name);
            streamingMethod.protocolState.branchKeyToStreamIdMap.push({ key: branchKey, streamId });
        }

        return streamId;
    }

    /** (subscription) Methods */
    private closeIndividualSubscription(streamingMethod: ServerMethodInfo, streamId: string, privateEventStreamSubject: string, sendKickMessage: boolean) {

        const subscription = streamingMethod.protocolState.subscriptions.filter((subItem) => {
            return (
                subItem.privateEventStreamSubject === privateEventStreamSubject &&
                subItem.streamId === streamId
            );
        })[0];

        if (typeof subscription !== "object") {
            return; // unrecognised subscription
        }

        const initialLength = streamingMethod.protocolState.subscriptions.length;

        streamingMethod.protocolState.subscriptions = streamingMethod.protocolState.subscriptions.filter((subItem) => {
            return !(
                subItem.privateEventStreamSubject === subscription.privateEventStreamSubject &&
                subItem.streamId === subscription.streamId
            );
        });

        const filteredLength = streamingMethod.protocolState.subscriptions.length;

        if (filteredLength !== (initialLength - 1)) {
            return; // the subscription wasn't removed
        }

        if (sendKickMessage === true) {
            this.sendResult({
                EventStreamAction: 2,
                EventStreamSubject: privateEventStreamSubject,
                MethodName: streamingMethod.protocolState.method.Method.Name,
                MethodRequestSubject: streamingMethod.protocolState.method.MethodRequestSubject,
                MethodResponseSubject: subscription.methodResponseSubject,
                MethodVersion: streamingMethod.protocolState.method.Method.Version,
                ResponseContextJson: {},
                Server: convertInstance(this.instance),
                StreamId: subscription.streamId,
                Status: 0,
            });
        }

        if (typeof this.subRemovedHandler === "function") {
            this.subRemovedHandler(subscription, streamingMethod);
        }
    }

    // Returns the names of branches for which there are live subscriptions
    private getUniqueBranchNames(streamingMethod: ServerMethodInfo): string[] {
        const keysWithDuplicates = streamingMethod.protocolState.subscriptions.map((sub) => {
            let result = null;
            if (typeof sub === "object" && typeof sub.branchKey === "string") {
                result = sub.branchKey;
            }
            return result;
        });

        const seen: string[] = [];

        const branchArray = keysWithDuplicates.filter((bKey) => {
            if (bKey === null || seen.indexOf(bKey) >= 0) {
                return false;
            }
            seen.push(bKey);
            return true;
        });

        return branchArray;
    }
}
