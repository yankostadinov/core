import { Protocol } from "../types";
import { Glue42Core } from "../../../glue";

/**
 * Connection to gateway V1 - the one that runs on the desktop without authentication
 */
export default class GW1Protocol implements Protocol {

    public _connection: Glue42Core.Connection.API;
    public _settings: Glue42Core.Connection.Settings;

    constructor(connection: Glue42Core.Connection.API, settings: Glue42Core.Connection.Settings) {
        this._connection = connection;
        this._settings = settings;
    }

    public get isLoggedIn() {
        return true;
    }

    public processStringMessage(message: string): { msg: object, msgType: string } {
        // GW1 messages have the following structure
        // {message: object, type: string}
        // so type is outside the message
        const messageObj: { message: object, type: string } = JSON.parse(message);
        return {
            msg: messageObj.message,
            msgType: messageObj.type,
        };
    }

    public createStringMessage(product: string, type: string, message: object, id: string): string {
        return JSON.stringify({
            type,
            message,
            id,
        });
    }

    public login(message: Glue42Core.Auth): Promise<Glue42Core.Connection.Identity> {
        return new Promise((resolve: (ci: Glue42Core.Connection.Identity) => void, reject) => {
            const sendOptions = {
                retryInterval: this._settings.reconnectInterval,
                maxRetries: this._settings.reconnectAttempts
            };

            this._connection.send("hello", "hello", {}, null, sendOptions)
                .then(() => resolve({ application: undefined }))
                .catch(reject);
        });
    }

    public logout() {
        // Do nothing
        // const inst = glue.agm.instance;
        //
        // this._connection.send("agm", "HeartbeatMessage", {
        //     PublishingInterval: 0,
        //     Instance: {
        //         ApplicationName: inst.application,
        //         ProcessId: inst.pid,
        //         MachineName: inst.machine,
        //         UserName: inst.user,
        //         Environment: inst.environment,
        //         Region: inst.region
        //     }
        // });
    }

    public loggedIn(callback: (() => void)) {
        callback();
        return () => {
            // do nothing
        };
    }

    public processObjectMessage(message: object): { msg: object, msgType: string } {
        throw new Error("not supported");
    }

    public createObjectMessage(product: string, type: string, message: object, id: string): object {
        throw new Error("not supported");
    }
}
