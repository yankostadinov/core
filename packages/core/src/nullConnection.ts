import { Glue42Core } from "../glue";

const connection: Glue42Core.Connection.API = {
    protocolVersion: -1,
    send: (product: string, type: string, message: object, id?: string, options?: Glue42Core.Connection.SendMessageOptions): Promise<void> => {
        return Promise.resolve(undefined);
    },

    on: (product: string, type: string, messageHandler: (msg: object) => void): { type: string; id: number; } => {
        return { type: "1", id: 1 };
    },
    off: (info: {
        type: string;
        id: number;
    }): void => { /** EMPTY */
    },
    login: (message: Glue42Core.Auth): Promise<Glue42Core.Connection.Identity> => {
        return undefined;
    },
    logout: (): void => {/** EMPTY */
    },
    loggedIn: (callback: (() => void)): (() => void) => {
        return undefined;
    },
    connected: (callback: (server: string) => void): (() => void) => {
        return undefined;
    },
    disconnected: (callback: () => void): () => void => {
        return undefined;
    },
    reconnect: (): Promise<void> => {
        return Promise.resolve();
    }
};
export default connection;
