import generate from "shortid";
import { default as CallbackRegistryFactory } from "callback-registry";
import Streaming from "./client-streaming";
import { convertInstance, isStreamingFlagSet } from "./helpers";
import { Glue42Core } from "../../../../glue";
import ClientRepository from "../../client/repository";
import { ClientMethodInfo, ServerInfo, ServerMethodsPair } from "../../client/types";
import { ClientProtocolDefinition, SubscribeError, SubscriptionInner } from "../../types";
import { InvokeResultMessage, InvokeStatus } from "../../client/client";

interface InvocationInfo {
    method: ClientMethodInfo;
    calledWith: object;
}

interface PendingCallback {
    invocationInfo: InvocationInfo;
    success: (result: InvokeResultMessage) => void;
    error: (result: InvokeResultMessage) => void;

}

const numberMissingHeartbeatsToRemove = 3;
export type GW1MethodDefinition = Glue42Core.AGM.MethodDefinition & { requestSubject: string };

export default class ClientProtocol implements ClientProtocolDefinition {

    private respCounter = 0;
    private callbacks = CallbackRegistryFactory();
    private streaming: Streaming;
    private timers: { [key: string]: any } = {};
    private _pendingCallbacks: { [id: string]: PendingCallback } = {};

    constructor(private connection: Glue42Core.Connection.API, private instance: Glue42Core.AGM.Instance, private configuration: Glue42Core.AGM.Settings, private repository: ClientRepository) {
        this.timers = {};
        this.streaming = new Streaming(
            configuration,
            instance,
            (msg: any) => {
                connection.send("agm", "MethodInvocationRequestMessage", msg);
            },
            () => this.nextResponseSubject(),
        );

        this.listenForEvents();
    }

    public subscribe(stream: ClientMethodInfo, args: object, targetServers: ServerMethodsPair[], options: Glue42Core.AGM.SubscriptionParams, success: (sub: Glue42Core.AGM.Subscription) => void, error: (err: SubscribeError) => void): void {
        this.streaming.subscribe(stream, args, targetServers, options, success, error);
    }

    public onInvocationResult(callback: any) {
        this.callbacks.add("onResult", callback);
    }

    public invoke(_: string, method: ClientMethodInfo, args: object, target: ServerInfo, stuff: Glue42Core.AGM.InvokeOptions): Promise<InvokeResultMessage> {
        const id: string = generate();

        const methodInfo = method.info as GW1MethodDefinition;
        // Construct a message
        const message = {
            MethodRequestSubject: methodInfo.requestSubject,
            MethodResponseSubject: this.nextResponseSubject(),
            Client: convertInstance(this.instance),
            Context: {
                ArgumentsJson: args,
                InvocationId: id,
                MethodName: methodInfo.name,
                ExecutionServer: target.info,
                Timeout: stuff.methodResponseTimeoutMs,
            },
        };
        this.onInvocationResult((invocationId: string, executedBy: Glue42Core.AGM.Instance, status: number, result: object, resultMessage: string) =>
            this.processInvocationResult(invocationId, executedBy, status, result, resultMessage)
        );

        return new Promise((resolve, reject) => {
            this._pendingCallbacks[id] = {
                invocationInfo: {
                    method,
                    calledWith: args,
                },
                success: (data: InvokeResultMessage) => resolve(data),
                error: (e: InvokeResultMessage) => reject(e)
            };

            this.connection.send("agm", "MethodInvocationRequestMessage", message);
        });
    }

    public drainSubscriptions(): SubscriptionInner[] {
        return [];
    }

    private nextResponseSubject(): string {
        return "resp_" + (this.respCounter++) + "_" + generate();
    }

    private createServerInfo(instance: any): Glue42Core.AGM.Instance {
        return {
            machine: instance.MachineName,
            pid: instance.ProcessId,
            user: instance.UserName,
            application: instance.ApplicationName,
            environment: instance.Environment,
            region: instance.Region,
        };
    }

    private createMethod(methodInfo: any): GW1MethodDefinition {
        const method = methodInfo.Method;
        return {
            name: method.Name,
            accepts: method.InputSignature,
            returns: method.ResultSignature,
            requestSubject: methodInfo.MethodRequestSubject,
            description: method.Description,
            displayName: method.DisplayName,
            version: method.Version,
            objectTypes: method.ObjectTypeRestrictions,
            // region: method.region || "TICK42",
            // environment: method.environment || "TRAINING",
            supportsStreaming: isStreamingFlagSet(method.Flags),
        };
    }

    // Generates a unique ID for a server
    private createServerId(serverInfo: any): string {
        if (serverInfo === undefined) {
            return undefined;
        }

        return [serverInfo.application,
            serverInfo.user,
            serverInfo.machine,
            serverInfo.started,
            serverInfo.pid].join("/").toLowerCase();
    }

    private processServerPresence(presence: any, isPresence: boolean) {

        const instance = presence.Instance;
        const serverInfo = this.createServerInfo(instance);
        let serverId = this.createServerId(serverInfo);

        if (isPresence) {
            // test
            // console.debug(new Date(), '  heard presence');
            // if (instance.ApplicationName === 'Dummy server') {
            //     console.debug(new Date(), '  got Dummy server presence', presence);
            // }

            serverId = this.repository.addServer(serverInfo, serverId);

            if (presence.PublishingInterval) {
                this.scheduleTimeout(serverId, presence.PublishingInterval);
            }
        } else if (presence.PublishingInterval === 0) {
            // Good bye message from Gateway
            const server = this.repository.getServerById(serverId);
            if (typeof server !== "undefined") {
                this.repository.removeServerById(serverId);
            }
        }

        // Finally, update the methods
        if (presence.MethodDefinitions !== undefined) {
            this.updateServerMethods(serverId, presence.MethodDefinitions);
        }
    }

    // This function sets a timeout which removes the server unless - the function is called again before the timeout is over
    private scheduleTimeout(serverId: string, duration: number) {

        if (duration === -1) {
            return;
        }
        // Stop the previous timeout
        const timer = this.timers[serverId];
        if (timer !== undefined) {
            clearTimeout(timer);
        }

        // Set a new one
        this.timers[serverId] = setTimeout(() => {
            this.repository.removeServerById(serverId);
        }, duration * (numberMissingHeartbeatsToRemove + 1));
    }

    // Updates the methods of a server
    private updateServerMethods(serverId: string, newMethods: Array<{ [key: string]: any }>) {

        // Get an array of the methods the server had before we started this
        const oldMethods = this.repository.getServerMethodsById(serverId);

        // Get an array of the methods that the server has now
        const newMethodsReduced: { [key: string]: any } = newMethods
            .map((nm) => this.createMethod(nm))
            .reduce((obj: { [key: string]: any }, method) => {
                const methodId = this.repository.createMethodId(method);
                obj[methodId] = method;
                return obj;
            }, {});

        // For each of the old methods
        oldMethods.forEach((method) => {

            // Check if it is still there
            if (newMethodsReduced[method.id] === undefined) {
                // If it isn't, remove it
                this.repository.removeServerMethod(serverId, method.id);
            } else {
                // If it is there in both the old array and the new one, we don't need to add it again
                delete newMethodsReduced[method.id];
            }
        });

        // Now add the new methods
        Object.keys(newMethodsReduced).forEach((key) => {
            const method = newMethodsReduced[key];
            this.repository.addServerMethod(serverId, method);
        });
    }

    private handleInvokeResultMessage(message: any) {

        // Delegate streaming-related messages to streaming
        if (message && message.EventStreamAction && message.EventStreamAction !== 0) {
            this.streaming.processPublisherMsg(message);
            return;
        }

        const server = message.Server ? this.createServerInfo(message.Server) : undefined;

        // parse the result
        let result = message.ResultContextJson;
        // If the result is an empty object, there is no result
        if (result && Object.keys(result).length === 0) {
            result = undefined;
        }

        this.callbacks.execute("onResult", message.InvocationId, server, message.Status, result, message.ResultMessage);
    }

    private listenForEvents() {
        this.connection.on("agm", "ServerPresenceMessage", (msg) => {
            this.processServerPresence(msg, true);
        });
        this.connection.on("agm", "ServerHeartbeatMessage", (msg) => {
            this.processServerPresence(msg, false);
        });
        this.connection.on("agm", "MethodInvocationResultMessage", (msg) => {
            this.handleInvokeResultMessage(msg);
        });
    }

    private processInvocationResult(invocationId: string, executedBy: Glue42Core.AGM.Instance, status: number, result: object, resultMessage: string) {
        // Finds the appropriate callback
        const callback = this._pendingCallbacks[invocationId];
        if (callback === undefined) {
            return;
        }
        // If the server returned success, execute the success callback
        if (status === InvokeStatus.Success && typeof callback.success === "function") {

            // Execute the success callback
            callback.success({
                invocationId,
                instance: executedBy,
                result,
                message: resultMessage,
                status: InvokeStatus.Success,
            });
            // Else, return an error
        } else if (typeof callback.error === "function") {

            callback.error({
                invocationId,
                instance: executedBy,
                result,
                message: resultMessage,
                status: InvokeStatus.Error,
            });
        }
        // Finally, remove the callbacks
        delete this._pendingCallbacks[invocationId];
    }

}
