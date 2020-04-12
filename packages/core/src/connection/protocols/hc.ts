import { Protocol } from "../types";
import { Glue42Core } from "../../../glue";

/**
 * Connection to HC
 */
export default class HCProtocol implements Protocol {
    public processStringMessage(message: string): { msg: object, msgType: string } {
        const messageObj: { message: object, type: string } = JSON.parse(message);
        return {
            msg: messageObj,
            msgType: messageObj.type,
        };
    }

    public createStringMessage(product: string, type: string, message: object, id: string): string {
        return JSON.stringify(message);
    }

    public login(message: Glue42Core.Auth): Promise<Glue42Core.Connection.Identity> {
        return Promise.resolve({ application: undefined });
    }

    public logout() {
        // Do nothing
    }

    public loggedIn(callback: () => void) {
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

    public get isLoggedIn() {
        return true;
    }
}
