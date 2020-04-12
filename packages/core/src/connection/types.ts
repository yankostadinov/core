import { Glue42Core} from "../../glue";

/**
 * This file contains a set of internal types used across the API codebase.
 * These are not part of api.ts because they should not be visible for the library user
 */

/**
 * GW3 protocol
 */
export interface GW3Protocol extends Protocol {
    domain(
        domain: string,
        logger: Glue42Core.Logger.API,
        successMessages?: string[],
        errorMessages?: string[]): Glue42Core.Connection.GW3DomainSession;

    authToken(): Promise<string>;
}

export interface Protocol {
    isLoggedIn: boolean;
    processStringMessage(message: string): { msg: object, msgType: string };
    createStringMessage(product: string, type: string, message: object, id: string): string;

    processObjectMessage(message: object): { msg: object, msgType: string };
    createObjectMessage(product: string, type: string, message: object, id: string): object;

    login(message: Glue42Core.Auth, reconnect?: boolean): Promise<Glue42Core.Connection.Identity>;
    logout(): void;
    loggedIn(callback: (() => void)): () => void;
}

export interface Transport {
    isObjectBasedTransport?: boolean;

    sendObject?: (msg: object, product: string, type: string, options: Glue42Core.Connection.SendMessageOptions) => Promise<void>;

    send(msg: string, product: string, type: string, options?: Glue42Core.Connection.SendMessageOptions): Promise<void>;

    onMessage(callback: (msg: string | object) => void): void;

    onConnectedChanged(callback: (connected: boolean) => void): void;

    open(): Promise<void>;

    close(): void;

    reconnect(): Promise<void>;
}
