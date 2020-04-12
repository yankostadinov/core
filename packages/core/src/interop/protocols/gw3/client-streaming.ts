import { Glue42Core } from "../../../../glue";
import ClientRepository from "../../client/repository";
import { ClientMethodInfo, ServerMethodsPair } from "../../client/types";
import * as GW3Messages from "./messages";
import { SubscriptionCancelledMessage, EventMessage, SubscribedMessage, ErrorSubscribingMessage } from "./messages";
import { SubscribeError, SubscriptionInner } from "../../types";
import { UserSubscription } from "./subscription";

const STATUS_AWAITING_ACCEPT = "awaitingAccept"; // not even one server has accepted yet
const STATUS_SUBSCRIBED = "subscribed"; // at least one server has responded as 'Accepting'
const ERR_MSG_SUB_FAILED = "Subscription failed.";
const ERR_MSG_SUB_REJECTED = "Subscription rejected.";
const ON_CLOSE_MSG_SERVER_INIT = "ServerInitiated";
const ON_CLOSE_MSG_CLIENT_INIT = "ClientInitiated";

/**
 * Handles registering methods and sending data to clients
 */
export default class ClientStreaming {
    private subscriptionsList: { [key: number]: SubscriptionInner } = {};
    private subscriptionIdToLocalKeyMap: { [key: string]: number } = {};
    private nextSubLocalKey = 0;

    constructor(private session: Glue42Core.Connection.GW3DomainSession, private repository: ClientRepository, private logger: Glue42Core.Logger.API) {
        session.on("subscribed", this.handleSubscribed);
        session.on("event", this.handleEventData);
        session.on("subscription-cancelled", this.handleSubscriptionCancelled);
    }

    public subscribe(streamingMethod: ClientMethodInfo, params: Glue42Core.AGM.SubscriptionParams, targetServers: ServerMethodsPair[], stuff: Glue42Core.AGM.SubscriptionParams, success: (sub: Glue42Core.AGM.Subscription) => void, error: (err: SubscribeError) => void, existingSub: SubscriptionInner) {
        if (targetServers.length === 0) {
            error({
                method: streamingMethod.getInfoForUser(),
                called_with: params.arguments,
                message: ERR_MSG_SUB_FAILED + " No available servers matched the target params.",
            });
            return;
        }

        // Note: used to find the subscription in subList. Do not confuse it with the gw-generated subscription_id
        const subLocalKey = this.getNextSubscriptionLocalKey();

        const pendingSub = this.registerSubscription(
            subLocalKey,
            streamingMethod,
            params,
            success,
            error,
            stuff.methodResponseTimeout,
            existingSub
        );

        if (typeof pendingSub !== "object") {
            error({
                method: streamingMethod.getInfoForUser(),
                called_with: params.arguments,
                message: ERR_MSG_SUB_FAILED + " Unable to register the user callbacks.",
            });
            return;
        }

        targetServers.forEach((target) => {

            const serverId = target.server.id;
            const method = target.methods.find((m) => m.info.name === streamingMethod.info.name);

            pendingSub.trackedServers.push({
                serverId,
                subscriptionId: undefined, // is assigned by gw3
            });

            const msg: GW3Messages.SubscribeMessage = {
                type: "subscribe",
                server_id: serverId,
                method_id: method.protocolState.id,
                arguments_kv: params.arguments,
            };

            this.session.send(msg, { serverId, subLocalKey })
                .then((m: SubscribedMessage) => this.handleSubscribed(m))
                .catch((err: ErrorSubscribingMessage) => this.handleErrorSubscribing(err));
        });
    }

    public drainSubscriptions() {
        const existing = Object.values(this.subscriptionsList);
        this.subscriptionsList = {};
        this.subscriptionIdToLocalKeyMap = {};
        return existing;
    }

    private getNextSubscriptionLocalKey() {
        const current = this.nextSubLocalKey;
        this.nextSubLocalKey += 1;
        return current;
    }

    // This adds subscription and after timeout (10000 default) removes it if it isn't STATUS_SUBSCRIBED
    private registerSubscription(subLocalKey: number, method: ClientMethodInfo, params: Glue42Core.AGM.SubscriptionParams, success: (sub: Glue42Core.AGM.Subscription) => void, error: (err: SubscribeError) => void, timeout: number, existingSub: SubscriptionInner) {
        const subsInfo: SubscriptionInner = {
            localKey: subLocalKey,
            status: STATUS_AWAITING_ACCEPT,
            method,
            params,
            success,
            error,
            trackedServers: [],
            handlers: {
                onData: existingSub?.handlers.onData || [],
                onClosed: existingSub?.handlers.onClosed || [],
                onConnected: existingSub?.handlers.onConnected || []
                // onFailed: []
            },
            queued: {
                data: [],
                closers: [],
            },
            timeoutId: undefined,
            close: () => this.closeSubscription(subLocalKey),
            subscription: existingSub?.subscription // only when re-connecting
        };

        if (!existingSub) {
            if (params.onData) {
                subsInfo.handlers.onData.push(params.onData);
            }
            if (params.onClosed) {
                subsInfo.handlers.onClosed.push(params.onClosed);
            }
            if (params.onConnected) {
                subsInfo.handlers.onConnected.push(params.onConnected);
            }
        }

        this.subscriptionsList[subLocalKey] = subsInfo;

        subsInfo.timeoutId = setTimeout(() => {
            if (this.subscriptionsList[subLocalKey] === undefined) {
                return; // no such subscription
            }

            const pendingSub = this.subscriptionsList[subLocalKey];

            if (pendingSub.status === STATUS_AWAITING_ACCEPT) {
                error({
                    method: method.getInfoForUser(),
                    called_with: params.arguments,
                    message: ERR_MSG_SUB_FAILED + " Subscription attempt timed out after " + timeout + " ms.",
                });

                // None of the target servers has answered the subscription attempt
                delete this.subscriptionsList[subLocalKey];

            } else if (pendingSub.status === STATUS_SUBSCRIBED && pendingSub.trackedServers.length > 0) {
                // Clean the trackedServers, removing those without valid streamId
                pendingSub.trackedServers = pendingSub.trackedServers.filter((server) => {
                    return (typeof server.subscriptionId !== "undefined");
                });

                delete pendingSub.timeoutId;

                if (pendingSub.trackedServers.length <= 0) {
                    // There are no open streams, some servers accepted then closed very quickly
                    //  (that's why the status changed but there's no good server with a StreamId)

                    // call the onClosed handlers
                    this.callOnClosedHandlers(pendingSub);

                    delete this.subscriptionsList[subLocalKey];
                }
            }
        }, timeout);

        return subsInfo;
    }

    private handleErrorSubscribing = (errorResponse: ErrorSubscribingMessage) => {
        const tag = errorResponse._tag;
        const subLocalKey = tag.subLocalKey;
        const pendingSub = this.subscriptionsList[subLocalKey];

        if (typeof pendingSub !== "object") {
            return;
        }

        pendingSub.trackedServers = pendingSub.trackedServers.filter((server) => {
            return server.serverId !== tag.serverId;
        });

        if (pendingSub.trackedServers.length <= 0) {
            clearTimeout(pendingSub.timeoutId);

            if (pendingSub.status === STATUS_AWAITING_ACCEPT) {
                // Reject with reason
                const reason = (typeof errorResponse.reason === "string" && errorResponse.reason !== "") ?
                    ' Publisher said "' + errorResponse.reason + '".' :
                    " No reason given.";

                const callArgs = typeof pendingSub.params.arguments === "object" ?
                    JSON.stringify(pendingSub.params.arguments) :
                    "{}";

                pendingSub.error({
                    message: ERR_MSG_SUB_REJECTED + reason + " Called with:" + callArgs,
                    called_with: pendingSub.params.arguments,
                    method: pendingSub.method.getInfoForUser(),
                });

            } else if (pendingSub.status === STATUS_SUBSCRIBED) {
                // The timeout may or may not have expired yet,
                // but the status is 'subscribed' and trackedServers is now empty

                this.callOnClosedHandlers(pendingSub);
            }

            delete this.subscriptionsList[subLocalKey];
        }
    }

    private handleSubscribed = (msg: SubscribedMessage) => {
        const subLocalKey = msg._tag.subLocalKey;
        const pendingSub = this.subscriptionsList[subLocalKey];

        if (typeof pendingSub !== "object") {
            return;
        }
        const serverId = msg._tag.serverId;

        // Add a subscription_id to this trackedServer

        const acceptingServer = pendingSub.trackedServers
            .filter((server) => {
                return server.serverId === serverId;
            })[0];

        if (typeof acceptingServer !== "object") {
            return;
        }

        acceptingServer.subscriptionId = msg.subscription_id;
        this.subscriptionIdToLocalKeyMap[msg.subscription_id] = subLocalKey;

        const isFirstResponse = (pendingSub.status === STATUS_AWAITING_ACCEPT);

        pendingSub.status = STATUS_SUBSCRIBED;

        if (isFirstResponse) {
            const reconnect: boolean = !!pendingSub.subscription;
            if (reconnect) {
                // re-connect case, we already have subscription object
                pendingSub.subscription.setNewSubscription(pendingSub);
                pendingSub.success(pendingSub.subscription);
            } else {
                const subsObject = new UserSubscription(this.repository, pendingSub);
                pendingSub.subscription = subsObject;
                // Pass in the subscription object
                pendingSub.success(subsObject);
            }

            pendingSub.handlers.onConnected.forEach((handler) => {
                try {
                    handler(pendingSub.subscription?.serverInstance, reconnect);
                } catch (e) {
                    // DO nothing
                }
            });
        }
    }

    private handleEventData = (msg: EventMessage) => {

        const subLocalKey = this.subscriptionIdToLocalKeyMap[msg.subscription_id];

        if (typeof subLocalKey === "undefined") {
            return;
        }

        const subscription = this.subscriptionsList[subLocalKey];

        if (typeof subscription !== "object") {
            return;
        }

        const trackedServersFound = subscription.trackedServers.filter((server) => {
            return server.subscriptionId === msg.subscription_id;
        });

        if (trackedServersFound.length !== 1) {
            return;
        }

        // out_of_band. (main stream band)
        const isPrivateData = msg.oob;

        const sendingServerId = trackedServersFound[0].serverId;

        // Create the arrivedData object, new object for each handler call
        const receivedStreamData = (): Glue42Core.AGM.StreamData => {
            return {
                data: msg.data,
                server: this.repository.getServerById(sendingServerId).getInfoForUser(),
                requestArguments: subscription.params.arguments,
                message: null,
                private: isPrivateData,
            };
        };

        const onDataHandlers = subscription.handlers.onData;
        const queuedData = subscription.queued.data;

        if (onDataHandlers.length > 0) {
            onDataHandlers.forEach((callback) => {
                if (typeof callback === "function") {
                    callback(receivedStreamData());
                }
            });
        } else {
            queuedData.push(receivedStreamData());
        }
    }

    // called only on stream.close() multiple-times for each subscription
    private handleSubscriptionCancelled = (msg: SubscriptionCancelledMessage) => {
        const subLocalKey = this.subscriptionIdToLocalKeyMap[msg.subscription_id];

        if (typeof subLocalKey === "undefined") {
            return;
        }

        const subscription = this.subscriptionsList[subLocalKey];

        if (typeof subscription !== "object") {
            return;
        }

        // Filter tracked servers
        const expectedNewLength = subscription.trackedServers.length - 1;

        subscription.trackedServers = subscription.trackedServers.filter((server) => {
            if (server.subscriptionId === msg.subscription_id) {
                subscription.queued.closers.push(server.serverId);
                return false;
            } else {
                return true;
            }
        });

        // Check if a server was actually removed
        if (subscription.trackedServers.length !== expectedNewLength) {
            // TODO: Log some error
            return;
        }

        // Check if this was the last remaining server
        if (subscription.trackedServers.length <= 0) {
            clearTimeout(subscription.timeoutId);
            this.callOnClosedHandlers(subscription);
            delete this.subscriptionsList[subLocalKey];
        }

        delete this.subscriptionIdToLocalKeyMap[msg.subscription_id];
    }

    private callOnClosedHandlers(subscription: SubscriptionInner, reason?: string) {

        const closersCount = subscription.queued.closers.length;
        const closingServerId = (closersCount > 0) ? subscription.queued.closers[closersCount - 1] : null;

        let closingServer: Glue42Core.AGM.Instance = null;
        if (closingServerId !== undefined && typeof closingServerId === "string") {
            closingServer = this.repository.getServerById(closingServerId).getInfoForUser();
        }

        subscription.handlers.onClosed.forEach((callback) => {
            if (typeof callback !== "function") {
                return;
            }

            callback({
                message: reason || ON_CLOSE_MSG_SERVER_INIT,
                requestArguments: subscription.params.arguments,
                server: closingServer,
                stream: subscription.method,
            });
        });
    }

    // called on client/server close (not on stream.close)
    private closeSubscription(subLocalKey: number) {
        const subscription = this.subscriptionsList[subLocalKey];

        if (typeof subscription !== "object") {
            return;
        }

        // Tell each server that we're unsubscribing
        subscription.trackedServers.forEach((server) => {
            if (typeof server.subscriptionId === "undefined") {
                return;
            }

            subscription.queued.closers.push(server.serverId);

            this.session.sendFireAndForget({
                type: "unsubscribe",
                subscription_id: server.subscriptionId,
                reason_uri: "",
                reason: ON_CLOSE_MSG_CLIENT_INIT,
            });

            delete this.subscriptionIdToLocalKeyMap[server.subscriptionId];
        });

        subscription.trackedServers = [];

        this.callOnClosedHandlers(subscription, ON_CLOSE_MSG_CLIENT_INIT);

        delete this.subscriptionsList[subLocalKey];
    }
}
