import { Transport } from "../types";
import { default as CallbackRegistryFactory, CallbackRegistry, UnsubscribeFunction } from "callback-registry";
import { Glue42Core } from "../../../glue";

/**
 * Inproc transport for GW3
 */
export default class Inproc implements Transport {
    private logger: Glue42Core.Logger.API;
    private gw: Glue42Core.Connection.GW3Facade;
    private connectToken: {};
    private registry: CallbackRegistry = CallbackRegistryFactory();
    private client: Glue42Core.Connection.GW3Client;

    constructor(gw: Glue42Core.Connection.GW3Facade, logger: Glue42Core.Logger.API) {
        this.gw = gw;
        this.logger = logger;
        this.gw.connect((_client, message) => {
            this.messageHandler(message);
        }).then((client) => {
            this.client = client;
        });
    }

    public get isObjectBasedTransport() {
        return true;
    }

    public sendObject(msg: object): Promise<void> {
        if (this.client) {
            this.client.send(msg);
            return Promise.resolve(undefined);
        } else {
            return Promise.reject(`not connected`);
        }
    }

    public send(msg: string, product: string, type: string) {
        return Promise.reject("not supported");
    }

    public onMessage(callback: (msg: string | object) => void): UnsubscribeFunction {
        return this.registry.add("onMessage", callback);
    }

    public onConnectedChanged(callback: (connected: boolean) => void) {
        callback(true);
    }

    public close() {
        // DO NOTHING
    }

    public open() {
        // do nothing
        return Promise.resolve();
    }
    public reconnect() {
        return Promise.resolve();
    }

    private messageHandler(msg: object) {
        this.registry.execute("onMessage", msg);
    }
}
