import { Glue42Core } from "../../glue";
import { default as CallbackFactory, CallbackRegistry } from "callback-registry";
import { Protocol, Transport } from "./types";

/**
 * A template for gateway connections - this is extended from specific protocols and transports.
 */
export default class ConnectionImpl implements Glue42Core.Connection.API {
    protected _protocol: Protocol;
    protected _transport: Transport;
    protected _settings: Glue42Core.Connection.Settings;

    // The message handlers that have to be executed for each received message
    protected messageHandlers: { [key: string]: { [key: string]: (msg: object) => void } } = {};
    protected ids = 1;
    protected registry: CallbackRegistry = CallbackFactory();
    protected _connected = false;
    protected logger: Glue42Core.Logger.API;

    private isTrace = false;

    constructor(settings: Glue42Core.Connection.Settings) {
        this._settings = settings;
        this.logger = settings.logger;
        this.isTrace = this.logger.canPublish("trace");
    }

    public init(transport: Transport, protocol: Protocol) {
        this._protocol = protocol;

        this._transport = transport;
        this._transport.onConnectedChanged(this.handleConnectionChanged.bind(this));
        this._transport.onMessage(this.handleTransportMessage.bind(this));
    }

    public send(product: string, type: string, message: object, id: string, options?: Glue42Core.Connection.SendMessageOptions): Promise<void> {
        // create a message using the protocol
        if (this._transport.isObjectBasedTransport) {
            const msg = this._protocol.createObjectMessage(product, type, message, id);
            if (this.isTrace) {
                this.logger.trace(`>> ${JSON.stringify(msg)}`);
            }
            return this._transport.sendObject(msg, product, type, options);
        } else {
            const strMessage = this._protocol.createStringMessage(product, type, message, id);
            if (this.isTrace) {
                this.logger.trace(`>> ${strMessage}}`);
            }
            return this._transport.send(strMessage, product, type, options);
        }
    }

    public on(product: string, type: string, messageHandler: (msg: object) => void): { type: string, id: number } {
        type = type.toLowerCase();
        if (this.messageHandlers[type] === undefined) {
            this.messageHandlers[type] = {};
        }

        const id = this.ids++;
        this.messageHandlers[type][id] = messageHandler;

        return {
            type,
            id,
        };
    }

    // Remove a handler
    public off(info: { type: string, id: number }) {
        delete this.messageHandlers[info.type.toLowerCase()][info.id];
    }

    public get isConnected() {
        return this._connected;
    }

    public connected(callback: (server: string) => void): () => void {
        if (this._connected) {
            callback(this._settings.ws || this._settings.http);
        }

        return this.registry.add("connected", callback);
    }

    public disconnected(callback: () => void): () => void {
        return this.registry.add("disconnected", callback);
    }

    public async login(authRequest: Glue42Core.Auth, reconnect?: boolean): Promise<Glue42Core.Connection.Identity> {
        // open the protocol in case it was closed by explicity logout
        await this._transport.open();
        return this._protocol.login(authRequest, reconnect);
    }

    public reconnect() {
        return this._transport.reconnect();
    }

    public logout() {
        this._protocol.logout();
        this._transport.close();
    }

    public loggedIn(callback: (() => void)) {
        return this._protocol.loggedIn(callback);
    }

    public get protocolVersion() {
        return this._settings.protocolVersion || 1;
    }

    public toAPI(): Glue42Core.Connection.API {
        const that = this;
        return {
            send: that.send.bind(that),
            on: that.on.bind(that),
            off: that.off.bind(that),
            login: that.login.bind(that),
            logout: that.logout.bind(that),
            loggedIn: that.loggedIn.bind(that),
            connected: that.connected.bind(that),
            disconnected: that.disconnected.bind(that),
            get protocolVersion() {
                return that.protocolVersion;
            },
            reconnect: that.reconnect.bind(that)
        };
    }

    private distributeMessage(message: object, type: string) {
        // Retrieve handlers for the message type
        const handlers = this.messageHandlers[type.toLowerCase()];
        if (handlers !== undefined) {
            // Execute them
            Object.keys(handlers).forEach((handlerId) => {
                const handler = handlers[handlerId];
                if (handler !== undefined) {
                    try {
                        handler(message);
                    } catch (error) {
                        this.logger.error(`Message handler failed with ${error.stack}`);
                    }
                }
            });
        }
    }

    private handleConnectionChanged(connected: boolean) {
        if (this._connected === connected) {
            return;
        }
        this._connected = connected;

        if (connected) {
            this.registry.execute("connected");
        } else {
            this.registry.execute("disconnected");
        }
    }

    private handleTransportMessage(msg: string | object) {
        let msgObj;
        if (typeof msg === "string") {
            msgObj = this._protocol.processStringMessage(msg);
        } else {
            msgObj = this._protocol.processObjectMessage(msg);
        }

        if (this.isTrace) {
            this.logger.trace(`<< ${JSON.stringify(msgObj)}`);
        }
        this.distributeMessage(msgObj.msg, msgObj.msgType);
    }
}
