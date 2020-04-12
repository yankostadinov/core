import { ClientMethodInfo, ServerMethodsPair } from "../../client/types";

import generate from "shortid";
import { convertInstance, convertInfoToInstance } from "./helpers";
import { Glue42Core } from "../../../../glue";
import { SubscribeError, SubscriptionInner } from "../../types";
import { GW1MethodDefinition } from "./client";

const STATUS_AWAITING_ACCEPT = "awaitingAccept"; // not even one server has accepted yet
const STATUS_SUBSCRIBED = "subscribed"; // at least one server has responded as 'Accepting'
const ERR_MSG_SUB_FAILED = "Subscription failed.";
const ERR_MSG_SUB_REJECTED = "Subscription rejected.";
const ON_CLOSE_MSG_SERVER_INIT = "ServerInitiated";
const ON_CLOSE_MSG_CLIENT_INIT = "ClientInitiated";

export default class ClientStreaming {
    private subscriptionsList: { [key: string]: any } = {};

    constructor(private configuration: Glue42Core.AGM.Settings, private instance: Glue42Core.AGM.Instance, private sendRequest: (msg: any) => void, private nextResponseSubject: () => string) {
    }

    public subscribe(stream: ClientMethodInfo, params: Glue42Core.AGM.SubscriptionParams, targetServers: ServerMethodsPair[], options: Glue42Core.AGM.SubscriptionParams, success: (sub: Glue42Core.AGM.Subscription) => void, error: (err: SubscribeError) => void) {
        if (targetServers.length === 0) {
            error({
                method: stream.getInfoForUser(),
                message: ERR_MSG_SUB_FAILED + " No available servers matched the target params.",
                called_with: params.arguments,
            });
            return;
        }

        // This same Id will be passed to all the servers (as 'InvocationId')
        // so they can respond back with it during the initial handshake
        const subscriptionId = "subscriptionId_" + generate();

        // Register the user's callbacks
        const pendingSub = this.registerSubscription(
            subscriptionId,
            stream,
            params,
            success,
            error,
            options.methodResponseTimeout,
        );

        if (typeof pendingSub !== "object") {
            error({
                method: stream.getInfoForUser(),
                message: ERR_MSG_SUB_FAILED + " Unable to register the user callbacks.",
                called_with: params.arguments,
            });
            return;
        }

        // Send a subscription request to each server
        targetServers.forEach((target) => {

            // Get a response subject for this invocation
            const responseSubject = this.nextResponseSubject();

            const requestSubject = (stream.info as GW1MethodDefinition).requestSubject;

            // Add server to the list of ones the client is expecting a response from
            pendingSub.trackedServers.push({
                server: undefined,
                streamId: undefined,
                streamSubjects: {
                    global: undefined,
                    private: undefined,
                },
                methodRequestSubject: requestSubject,
                methodResponseSubject: responseSubject,
            });

            // Construct a message
            const message = {
                EventStreamAction: 1, // "Subscribe" = client wishes to subscribe
                MethodRequestSubject: requestSubject,
                MethodResponseSubject: responseSubject,
                Client: convertInstance(this.instance),
                Context: {
                    ArgumentsJson: params.arguments,
                    InvocationId: subscriptionId,
                    MethodName: stream.info.name,
                    ExecutionServer: target.server.info,
                    Timeout: options.methodResponseTimeout,
                },
            };

            // Send it
            this.sendRequest(message);
        });
    }

    public processPublisherMsg(msg: any) {
        if (!(msg && msg.EventStreamAction && msg.EventStreamAction !== 0)) {
            return;
        }

        if (msg.EventStreamAction === 2) {

            this.serverIsKickingASubscriber(msg);

        } else if (msg.EventStreamAction === 3) {

            this.serverAcknowledgesGoodSubscription(msg);

        } else if (msg.EventStreamAction === 5) {

            this.serverHasPushedSomeDataIntoTheStream(msg);
        }

    }

    private registerSubscription(subscriptionId: string, method: ClientMethodInfo, params: Glue42Core.AGM.SubscriptionParams, success: (sub: Glue42Core.AGM.Subscription) => void, error: (err: any) => void, timeout: number) {

        this.subscriptionsList[subscriptionId] = {
            status: STATUS_AWAITING_ACCEPT,
            method,
            params,
            success,
            error,
            trackedServers: [],
            handlers: {
                onData: [],
                onClosed: [],
                // onFailed: []
            },
            queued: {
                data: [],
                closers: [],
            },
            timeoutId: undefined,
        };

        this.subscriptionsList[subscriptionId].timeoutId = setTimeout(() => {
            if (this.subscriptionsList[subscriptionId] === undefined) {
                return; // no such subscription
            }

            const subscription = this.subscriptionsList[subscriptionId];

            if (subscription.status === STATUS_AWAITING_ACCEPT) {
                error({
                    method,
                    called_with: params.arguments,
                    message: ERR_MSG_SUB_FAILED + " Subscription attempt timed out after " + timeout + "ms.",
                });

                // None of the target servers has answered the subscription attempt
                delete this.subscriptionsList[subscriptionId];

            } else if (subscription.status === STATUS_SUBSCRIBED &&
                subscription.trackedServers.length > 0) {
                // Clean the trackedServers, removing those without valid streamId
                subscription.trackedServers = subscription.trackedServers.filter((server: any) => {
                    return (typeof server.streamId === "string" && server.streamId !== "");
                });

                subscription.timeoutId = undefined;

                if (subscription.trackedServers.length === 0) {
                    // TODO this might be dead-code, where is closers.push?
                    // There are no open streams, some servers accepted then closed very quickly
                    // (that's why the status changed but there's no good server with a StreamId)

                    // call the onClosed handlers
                    const closersCount = subscription.queued.closers.length;
                    const closingServer = (closersCount > 0) ? subscription.queued.closers[closersCount - 1] : null;

                    subscription.handlers.onClosed.forEach((callback: (msg: any) => void) => {
                        if (typeof callback === "function") {
                            callback({
                                message: ON_CLOSE_MSG_SERVER_INIT,
                                requestArguments: subscription.params.arguments,
                                server: closingServer,
                                stream: subscription.method,
                            });
                        }
                    });

                    delete this.subscriptionsList[subscriptionId];
                }
            }
        }, timeout);

        return this.subscriptionsList[subscriptionId];
    }

    private serverIsKickingASubscriber(msg: any) {
        // Note: this might be either the server rejecting a subscription request OR closing an existing subscription

        // Get ALL subscriptions
        let keys = Object.keys(this.subscriptionsList);

        // If it is a rejection there may be an InvocationId, it can narrow the search
        if (typeof msg.InvocationId === "string" && msg.InvocationId !== "") {
            keys = keys.filter((k) => k === msg.InvocationId);
        }

        const deletionsList: string[] = [];

        // Find the kicking/rejecting server and remove it from the subscription.trackedServers[]
        keys.forEach((key) => {
            if (typeof this.subscriptionsList[key] !== "object") {
                return;
            }

            this.subscriptionsList[key].trackedServers = this.subscriptionsList[key].trackedServers.filter((server: any) => {
                const isRejecting = (
                    server.methodRequestSubject === msg.MethodRequestSubject && server.methodResponseSubject === msg.MethodResponseSubject
                );

                const isKicking = (
                    server.streamId === msg.StreamId &&
                    (server.streamSubjects.global === msg.EventStreamSubject || server.streamSubjects.private === msg.EventStreamSubject)
                );

                const isRejectingOrKicking = isRejecting || isKicking;

                return !isRejectingOrKicking;
            });

            if (this.subscriptionsList[key].trackedServers.length === 0) {
                deletionsList.push(key);
            }
        });

        // Call onClosed OR error()
        // and remove the subscription
        deletionsList.forEach((key) => {
            if (typeof this.subscriptionsList[key] !== "object") {
                return;
            }

            if (this.subscriptionsList[key].status === STATUS_AWAITING_ACCEPT &&
                typeof this.subscriptionsList[key].timeoutId === "number") {
                const reason = (typeof msg.ResultMessage === "string" && msg.ResultMessage !== "") ?
                    ' Publisher said "' + msg.ResultMessage + '".' :
                    " No reason given.";

                const callArgs = typeof this.subscriptionsList[key].params.arguments === "object" ?
                    JSON.stringify(this.subscriptionsList[key].params.arguments) :
                    "{}";

                this.subscriptionsList[key].error(ERR_MSG_SUB_REJECTED + reason + " Called with:" + callArgs);
                clearTimeout(this.subscriptionsList[key].timeoutId);

            } else {

                // The timeout may or may not have expired yet,
                // but the status is 'subscribed' and trackedServers is now empty

                this.subscriptionsList[key].handlers.onClosed.forEach((callback: (msg: any) => void) => {
                    if (typeof callback !== "function") {
                        return;
                    }

                    callback({
                        message: ON_CLOSE_MSG_SERVER_INIT,
                        requestArguments: this.subscriptionsList[key].params.arguments,
                        server: convertInfoToInstance(msg.Server),
                        stream: this.subscriptionsList[key].method,
                    });
                });

            }

            delete this.subscriptionsList[key];
        });
    }

    // action 3
    private serverAcknowledgesGoodSubscription(msg: any) {

        const subscriptionId = msg.InvocationId;

        const subscription = this.subscriptionsList[subscriptionId];

        if (typeof subscription !== "object") {
            return;
        }

        const acceptingServer = subscription.trackedServers.filter((server: any) => {
            return (
                server.methodRequestSubject === msg.MethodRequestSubject &&
                server.methodResponseSubject === msg.MethodResponseSubject
            );
        })[0];

        if (typeof acceptingServer !== "object") {
            return;
        }

        const isFirstResponse = (subscription.status === STATUS_AWAITING_ACCEPT);

        subscription.status = STATUS_SUBSCRIBED;

        const privateStreamSubject = this.generatePrivateStreamSubject(subscription.method.name);

        if (typeof acceptingServer.streamId === "string" && acceptingServer.streamId !== "") {
            return; // already accepted previously
        }

        acceptingServer.server = convertInfoToInstance(msg.Server);
        acceptingServer.streamId = msg.StreamId;
        acceptingServer.streamSubjects.global = msg.EventStreamSubject;
        acceptingServer.streamSubjects.private = privateStreamSubject;
        // acceptingServer.methodResponseSubject stays the same

        const confirmatoryRequest = {
            EventStreamAction: 3, // "Subscribed" = client confirms intention to subscribe
            EventStreamSubject: privateStreamSubject,
            StreamId: msg.StreamId,
            MethodRequestSubject: msg.MethodRequestSubject,
            MethodResponseSubject: acceptingServer.methodResponseSubject,
            Client: convertInstance(this.instance),
            Context: {
                ArgumentsJson: subscription.params.arguments,
                MethodName: subscription.method.name,
            },
        };

        this.sendRequest(confirmatoryRequest);

        if (isFirstResponse) {
            // Pass in the subscription object
            subscription.success({
                onData: function(dataCallback: (item: any) => void) {
                    if (typeof dataCallback !== "function") {
                        throw new TypeError("The data callback must be a function.");
                    }

                    this.handlers.onData.push(dataCallback);
                    if (this.handlers.onData.length === 1 && this.queued.data.length > 0) {
                        this.queued.data.forEach((dataItem: any) => {
                            dataCallback(dataItem);
                        });
                    }
                }.bind(subscription),
                onClosed: function(closedCallback: (item: any) => void) {
                    if (typeof closedCallback !== "function") {
                        throw new TypeError("The callback must be a function.");
                    }
                    this.handlers.onClosed.push(closedCallback);
                }.bind(subscription),
                onFailed: () => { /* Will not be implemented for browser. */ },
                close: () => this.closeSubscription(subscription, subscriptionId),
                requestArguments: subscription.params.arguments,
                serverInstance: convertInfoToInstance(msg.Server),
                stream: subscription.method,
            });
        }
    }

    // action 5
    private serverHasPushedSomeDataIntoTheStream(msg: any) {

        // Find the subscription of interest by trawling the dictionary
        for (const key in this.subscriptionsList) {
            if (this.subscriptionsList.hasOwnProperty(key) && typeof this.subscriptionsList[key] === "object") {

                let isPrivateData;

                const trackedServersFound = this.subscriptionsList[key].trackedServers.filter((ls: any) => {
                    return (ls.streamId === msg.StreamId &&
                        (ls.streamSubjects.global === msg.EventStreamSubject ||
                            ls.streamSubjects.private === msg.EventStreamSubject)
                    );
                });

                if (trackedServersFound.length === 0) {
                    isPrivateData = undefined;
                } else if (trackedServersFound[0].streamSubjects.global === msg.EventStreamSubject) {
                    isPrivateData = false;
                } else if (trackedServersFound[0].streamSubjects.private === msg.EventStreamSubject) {
                    isPrivateData = true;
                }

                if (isPrivateData !== undefined) {
                    // create the arrivedData object
                    const receivedStreamData = {
                        data: msg.ResultContextJson,
                        server: convertInfoToInstance(msg.Server),
                        requestArguments: this.subscriptionsList[key].params.arguments || {},
                        message: msg.ResultMessage,
                        private: isPrivateData,
                    };

                    const onDataHandlers = this.subscriptionsList[key].handlers.onData;
                    const queuedData = this.subscriptionsList[key].queued.data;

                    if (Array.isArray(onDataHandlers)) {
                        if (onDataHandlers.length > 0) {
                            onDataHandlers.forEach((callback) => {
                                if (typeof callback === "function") {
                                    callback(receivedStreamData);
                                }
                            });
                        } else {
                            queuedData.push(receivedStreamData);
                        }
                    }
                }
            }
        }// end for-in
    }

    /** (subscription) Methods */
    private closeSubscription(sub: any, subId: string) {

        const responseSubject = this.nextResponseSubject();

        sub.trackedServers.forEach((server: any) => {
            this.sendRequest({
                EventStreamAction: 2,
                Client: convertInstance(this.instance),
                MethodRequestSubject: server.methodRequestSubject,
                MethodResponseSubject: responseSubject,
                StreamId: server.streamId,
                EventStreamSubject: server.streamSubjects.private,
            });
        });

        // Call the onClosed handlers
        sub.handlers.onClosed.forEach((callback: (msg: any) => void) => {
            if (typeof callback === "function") {
                callback({
                    message: ON_CLOSE_MSG_CLIENT_INIT,
                    requestArguments: sub.arguments || {},
                    server: sub.trackedServers[sub.trackedServers.length - 1].server, // the last one of multi-server subscription
                    stream: sub.method,
                });
            }
        });

        delete this.subscriptionsList[subId];
    }

    private generatePrivateStreamSubject(methodName: string) {

        const appInfo = convertInstance(this.instance);

        return "ESSpriv-jsb_" +
            appInfo.ApplicationName +
            "_on_" +
            methodName +
            "_" +
            generate();
    }
}
