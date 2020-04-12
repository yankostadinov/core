import { CallbackRegistry, default as CallbackRegistryFactory } from "callback-registry";
import ClientStreaming from "./client-streaming";
import {
    CallMessage,
    ErrorMessage,
    MethodsAddedMessage,
    MethodsRemovedMessage,
    PeerAddedMessage,
    PeerRemovedMessage,
    ResultMessage
} from "./messages";
import { Glue42Core } from "../../../../glue";
import ClientRepository from "../../client/repository";
import { ClientMethodInfo, ServerInfo, ServerMethodsPair } from "../../client/types";
import { ClientProtocolDefinition, SubscribeError, SubscriptionInner } from "../../types";
import { InvokeResultMessage, InvokeStatus } from "../../client/client";
import { UserSubscription } from "./subscription";

/**
 * Handles session lifetime and events
 */
export default class ClientProtocol implements ClientProtocolDefinition {
    private streaming: ClientStreaming;
    private callbacks: CallbackRegistry = CallbackRegistryFactory();

    constructor(private session: Glue42Core.Connection.GW3DomainSession, private repository: ClientRepository, private logger: Glue42Core.Logger.API) {
        session.on("peer-added", (msg: PeerAddedMessage) => this.handlePeerAdded(msg));
        session.on("peer-removed", (msg: PeerRemovedMessage) => this.handlePeerRemoved(msg));
        session.on("methods-added", (msg: MethodsAddedMessage) => this.handleMethodsAddedMessage(msg));
        session.on("methods-removed", (msg: MethodsRemovedMessage) => this.handleMethodsRemovedMessage(msg));

        this.streaming = new ClientStreaming(session, repository, logger);
    }

    public subscribe(stream: ClientMethodInfo, args: object, targetServers: ServerMethodsPair[], options: Glue42Core.AGM.SubscriptionParams, success: (sub: Glue42Core.AGM.Subscription) => void, error: (err: SubscribeError) => void, existingSub: SubscriptionInner): void {
        this.streaming.subscribe(stream, args, targetServers, options, success, error, existingSub);
    }

    public invoke(id: string, method: ClientMethodInfo, args: object, target: ServerInfo): Promise<InvokeResultMessage> {

        const serverId = target.id;
        const methodId = method.protocolState.id;
        const msg: CallMessage = {
            type: "call",
            server_id: serverId,
            method_id: methodId,
            arguments_kv: args,
        };

        // we transfer the invocation id as tag
        return this.session.send(msg, { invocationId: id, serverId })
            .then((m: ResultMessage) => this.handleResultMessage(m))
            .catch((err) => this.handleInvocationError(err));
    }

    public drainSubscriptions() {
        return this.streaming.drainSubscriptions();
    }

    private handlePeerAdded(msg: PeerAddedMessage) {
        const newPeerId = msg.new_peer_id;
        const remoteId = msg.identity;
        const isLocal = msg.meta ? msg.meta.local : true;
        const pid = Number(remoteId.process);

        const serverInfo: Glue42Core.AGM.Instance = {
            machine: remoteId.machine,
            pid: isNaN(pid) ? remoteId.process : pid,
            instance: remoteId.instance,
            application: remoteId.application,
            applicationName: remoteId.applicationName,
            environment: remoteId.environment,
            region: remoteId.region,
            user: remoteId.user,
            windowId: remoteId.windowId,
            peerId: newPeerId,
            api: remoteId.api,
            isLocal
        };

        this.repository.addServer(serverInfo, newPeerId);
    }

    private handlePeerRemoved(msg: PeerRemovedMessage) {
        const removedPeerId = msg.removed_id;
        const reason = msg.reason;

        this.repository.removeServerById(removedPeerId, reason);
    }

    private handleMethodsAddedMessage(msg: MethodsAddedMessage) {
        const serverId = msg.server_id;
        const methods = msg.methods;

        methods.forEach((method) => {
            const methodInfo: Glue42Core.AGM.MethodDefinition = {
                name: method.name,
                displayName: method.display_name,
                description: method.description,
                version: method.version,
                objectTypes: method.object_types || [],
                accepts: method.input_signature,
                returns: method.result_signature,
                supportsStreaming: typeof method.flags !== "undefined" ? method.flags.streaming : false,
            };

            this.repository.addServerMethod(serverId, methodInfo, { id: method.id });
        });
    }

    private handleMethodsRemovedMessage(msg: MethodsRemovedMessage) {
        const serverId = msg.server_id;
        const methodIdList = msg.methods;

        const server = this.repository.getServerById(serverId);
        const serverMethodKeys = Object.keys(server.methods);

        serverMethodKeys.forEach((methodKey) => {
            const method = server.methods[methodKey];
            if (methodIdList.indexOf(method.protocolState.id) > -1) {
                this.repository.removeServerMethod(serverId, methodKey);
            }
        });
    }

    private handleResultMessage(msg: ResultMessage): InvokeResultMessage {
        const invocationId = msg._tag.invocationId;
        const result = msg.result;
        const serverId = msg._tag.serverId;
        const server = this.repository.getServerById(serverId);

        return {
            invocationId,
            result,
            instance: server.getInfoForUser(),
            status: InvokeStatus.Success,
            message: ""
        };
    }

    private handleInvocationError(msg: ErrorMessage): InvokeResultMessage {
        // TODO check for log level
        this.logger.debug(`handle invocation error ${JSON.stringify(msg)}`);

        const invocationId = msg._tag.invocationId;
        const serverId = msg._tag.serverId;
        const server = this.repository.getServerById(serverId);
        const message = msg.reason;
        const context = msg.context;

        return {
            invocationId,
            result: context,
            instance: server.getInfoForUser(),
            status: InvokeStatus.Error,
            message
        };
        // this.callbacks.execute("onResult", invocationId, server.getInfoForUser(), 1, context, message);
    }
}
