import { Glue42Core } from "../../glue";
import BaseConnection from "./connection";
import { GW3Protocol, Transport } from "./types";

import { MessageReplayerImpl } from "./messageReplayer";

export default class GW3ConnectionImpl extends BaseConnection implements Glue42Core.Connection.GW3Connection {
    public peerId: string;
    public token: string;
    public info: object;
    public resolvedIdentity: object;
    public availableDomains: object[];
    public gatewayToken: string;
    public replayer: Glue42Core.Connection.MessageReplayer;

    private gw3Protocol: GW3Protocol;

    constructor(settings: Glue42Core.Connection.Settings) {
        super(settings);
        if (settings.replaySpecs &&
            settings.replaySpecs.length) {
            this.replayer = new MessageReplayerImpl(settings.replaySpecs);
        }
    }

    public init(transport: Transport, protocol: GW3Protocol) {
        super.init(transport, protocol);
        if (this.replayer) {
            this.replayer.init(this);
        }
        this.gw3Protocol = protocol;
    }

    public toAPI(): Glue42Core.Connection.GW3Connection {
        const that = this;
        const superAPI = super.toAPI();
        return {
            domain: that.domain.bind(that),
            get peerId() { return that.peerId; },
            get token() { return that.token; },
            get info() { return that.info; },
            get resolvedIdentity() { return that.resolvedIdentity; },
            get availableDomains() { return that.availableDomains; },
            get gatewayToken() { return that.gatewayToken; },
            get replayer() { return that.replayer; },

            on: superAPI.on,
            send: superAPI.send,
            off: superAPI.off,
            login: superAPI.login,
            logout: superAPI.logout,
            loggedIn: superAPI.loggedIn,
            connected: superAPI.connected,
            disconnected: superAPI.disconnected,
            authToken: that.authToken.bind(that),
            reconnect: superAPI.reconnect,

            get protocolVersion() { return superAPI.protocolVersion; },
        };
    }

    public domain(
        domain: string,
        logger?: Glue42Core.Logger.API,
        successMessages?: string[],
        errorMessages?: string[]
    ): Glue42Core.Connection.GW3DomainSession {

        return this.gw3Protocol.domain(domain, logger, successMessages, errorMessages);

    }

    public authToken(): Promise<string> {
        return this.gw3Protocol.authToken();
    }

    public get isConnected() {
        return this._protocol.isLoggedIn;
    }

    public connected(callback: (server: string) => void): () => void {
        return this._protocol.loggedIn(() => {
            callback(this._settings.ws);
        });
    }
}
