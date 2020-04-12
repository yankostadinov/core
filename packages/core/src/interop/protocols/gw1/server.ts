import generate from "shortid";
import ServerStreaming from "./server-streaming";
import { default as CallbackRegistryFactory, CallbackRegistry } from "callback-registry";
import { convertInstance, convertInfoToInstance } from "./helpers";
import { Glue42Core } from "../../../../glue";
import ServerRepository from "../../server/repository";
import { ServerMethodInfo, ResultContext, RequestContext, ServerSubscriptionInfo } from "../../server/types";
import { ServerProtocolDefinition } from "../../types";

const HeartbeatInterval = 5000;
const PresenceInterval = 10000;

export default class ServerProtocol implements ServerProtocolDefinition {
    public onSubRequest: (callback: (requestContext: RequestContext, repoMethod: ServerMethodInfo) => void) => void;
    public onSubAdded: (callback: (subscription: ServerSubscriptionInfo, repoMethod: ServerMethodInfo) => void) => void;
    public onSubRemoved: (callback: (subscriber: ServerSubscriptionInfo, repoMethod: ServerMethodInfo) => void) => void;
    public rejectRequest: (requestContext: RequestContext, streamingMethod: ServerMethodInfo, reason: string) => void;
    public acceptRequestOnBranch: (requestContext: RequestContext, streamingMethod: ServerMethodInfo, branch: string) => void;
    public pushData: (streamingMethod: ServerMethodInfo, data: object, branches: string[]) => void;
    public pushDataToSingle: (streamingMethod: ServerMethodInfo, subscription: ServerSubscriptionInfo, data: object) => void;
    public closeSingleSubscription: (streamingMethod: ServerMethodInfo, subscription: ServerSubscriptionInfo) => void;
    public closeAllSubscriptions: (streamingMethod: ServerMethodInfo, branchKey?: string) => void;
    public getSubscriptionList: (streamingMethod: ServerMethodInfo, branchKey?: string) => ServerSubscriptionInfo[];
    public getBranchList: (streamingMethod: ServerMethodInfo) => string[];

    private invocationMessagesMap: { [key: string]: any } = {};  // {invocationId: Invocation_RequestMessage}
    private reqCounter = 0;
    private presenceTimer: any;
    private heartbeatTimer: any;
    private callbacks = CallbackRegistryFactory();
    private streaming: ServerStreaming;

    constructor(private connection: Glue42Core.Connection.API, private instance: Glue42Core.AGM.Instance, configuration: Glue42Core.AGM.Settings, private serverRepository: ServerRepository) {

        this.streaming = new ServerStreaming(connection, instance);
        connection.on("agm", "MethodInvocationRequestMessage", (msg) => this.handleMethodInvocationMessage(msg));
        connection.disconnected(this.stopTimers.bind(this));
        this.sendHeartbeat();
        if (this.heartbeatTimer === undefined) {
            this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), HeartbeatInterval);
        }

        this.getBranchList = this.streaming.getBranchList;
        this.getSubscriptionList = this.streaming.getSubscriptionList;
        this.closeAllSubscriptions = this.streaming.closeAllSubscriptions;
        this.closeSingleSubscription = this.streaming.closeSingleSubscription;
        this.pushDataToSingle = this.streaming.pushDataToSingle;
        this.pushData = this.streaming.pushData;
        this.onSubRequest = this.streaming.onSubRequest;
        this.acceptRequestOnBranch = this.streaming.acceptRequestOnBranch;
        this.rejectRequest = this.streaming.rejectRequest;
        this.onSubAdded = this.streaming.onSubAdded;
        this.onSubRemoved = this.streaming.onSubRemoved;
    }

    public stopTimers() {
        clearInterval(this.presenceTimer);
        clearInterval(this.heartbeatTimer);
    }

    public unregister(info: ServerMethodInfo): Promise<void> {
        this.sendPresence();
        return Promise.resolve();
    }

    public register(repoMethod: ServerMethodInfo): Promise<void> {
        // Get a request subject for this method
        const reqSubj = this.nextRequestSubject();

        repoMethod.protocolState.method = this.createNewMethodMessage(repoMethod.definition, reqSubj, false);

        this.announceNewMethod();

        return Promise.resolve();
    }

    /** Create a streaming method */
    public createStream(repoMethod: ServerMethodInfo): Promise<void> {
        const reqSubj = this.nextRequestSubject();

        const streamConverted = this.createNewMethodMessage(repoMethod.definition, reqSubj, true);

        // Used for presences
        repoMethod.protocolState.method = streamConverted;

        // Utility things for this protocol
        repoMethod.protocolState.globalEventStreamSubject = repoMethod.definition.name + ".jsStream." + generate();
        repoMethod.protocolState.subscriptions = [];
        repoMethod.protocolState.branchKeyToStreamIdMap = []; // [ {branchKey: '', streamId: 'strj_nds7`8`6y2378yb'}, {...}, ...]

        this.announceNewMethod();

        return Promise.resolve();
    }

    public onInvoked(callback: (methodToExecute: ServerMethodInfo, invocationId: string, invocationArgs: ResultContext) => void): void {
        this.callbacks.add("onInvoked", callback);
    }

    public methodInvocationResult(executedMethod: ServerMethodInfo, invocationId: string, err: string, result: object): void {

        const message = this.invocationMessagesMap[invocationId];
        if (!message) {
            return;
        }

        // Don't send result if the client does not require it
        if (message.MethodResponseSubject === "null") {
            return;
        }

        if (executedMethod === undefined) {
            return;
        }

        const resultMessage = {
            MethodRequestSubject: message.MethodRequestSubject,
            MethodResponseSubject: message.MethodResponseSubject,
            MethodName: executedMethod.protocolState.method.Method.Name,
            InvocationId: invocationId,
            ResultContextJson: result,
            Server: convertInstance(this.instance),
            ResultMessage: err,
            Status: err ? 1 : 0,
        };
        // Send result
        this.connection.send("agm", "MethodInvocationResultMessage", resultMessage);

        delete this.invocationMessagesMap[invocationId];
    }

    private nextRequestSubject() {
        return "req_" + (this.reqCounter++) + "_" + generate();
    }

    // Sends a heartbeat
    private sendHeartbeat() {
        this.connection.send("agm", "ServerHeartbeatMessage", this.constructHeartbeat());
    }

    // Constructs a heartbeat message
    private constructHeartbeat() {
        return {
            PublishingInterval: HeartbeatInterval,
            Instance: convertInstance(this.instance),
        };
    }

    // Constructs a presence message
    private constructPresence() {
        const methods = this.serverRepository.getList();

        return {
            PublishingInterval: PresenceInterval,
            Instance: convertInstance(this.instance),
            MethodDefinitions: methods.map((m) => m.protocolState.method),
        };
    }

    // Sends a presence
    private sendPresence() {
        this.connection.send("agm", "ServerPresenceMessage", this.constructPresence());
    }

    private announceNewMethod() {

        // Send presence so the clients know we have it
        this.sendPresence();

        // Start sending presence regularly (if we aren't already doing it)
        if (this.presenceTimer === undefined) {
            this.presenceTimer = setInterval(() => this.sendPresence(), PresenceInterval);
        }
    }

    // Listens for method invocations
    private handleMethodInvocationMessage(message: any) {
        const subject = message.MethodRequestSubject;
        const methodList = this.serverRepository.getList();

        const method = methodList.filter((m) => {
            return m.protocolState.method.MethodRequestSubject === subject;
        })[0];

        // Stop if the message isn't for us
        if (method === undefined) {
            return;
        }

        // TODO see if have to move this earlier - i.e. if some messages from Client don't have MethodRequestSubject
        // Check if message is stream-related : defer to streaming module
        if (this.streaming.isStreamMsg(message, method)) {
            this.streaming.processSubscriberMsg(message, method);
            return;
        }

        const invocationId = message.Context.InvocationId;
        this.invocationMessagesMap[invocationId] = message;

        const invocationArgs = {
            args: message.Context.ArgumentsJson,
            instance: convertInfoToInstance(message.Client),
        };
        this.callbacks.execute("onInvoked", method, invocationId, invocationArgs);
    }

    private createNewMethodMessage(methodIdentifier: Glue42Core.AGM.MethodDefinition, subject: string, stream: boolean) {
        // If we are given a string instead of an object, we presume that is the method's name:
        if (typeof methodIdentifier === "string") {
            methodIdentifier = { name: methodIdentifier };
        }

        // Set default values
        if (typeof methodIdentifier.version !== "number") {
            methodIdentifier.version = 0;
        }

        // Convert the method definition to the format that AGM requires
        return {
            Method: {
                Name: methodIdentifier.name,
                InputSignature: methodIdentifier.accepts,
                ResultSignature: methodIdentifier.returns,
                Description: methodIdentifier.description,
                DisplayName: methodIdentifier.displayName,
                Version: methodIdentifier.version,
                ObjectTypeRestrictions: methodIdentifier.objectTypes,
                Flags: stream ? 32 : undefined, // 100000 bitmask with the largest flag (streaming: true)
            },
            MethodRequestSubject: subject,
        };
    }
}
