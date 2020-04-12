import { Glue42Core } from "../../glue";
import { GW3Bridge } from "./bridges/gw3/gw3Bridge";
import { HCBridge } from "./bridges/hcBridge";
import { ContextBridge } from "./contextBridge";

export class ContextsModule implements Glue42Core.Contexts.API {

    public initTime: number;
    public initStartTime: number;
    public initEndTime?: number;
    private _bridge: ContextBridge;

    public constructor(private config: Glue42Core.Contexts.ContextsConfig) {
        try {
            if (config.gdMajorVersion === 2) {
                const hc = window.htmlContainer;
                if (!hc.sharedContextFacade) {
                    throw new Error("Your version of HtmlContainer does not support contexts."
                        + " Get version 1.46.0.0 or later to have that feature.");
                }
                this._bridge = new HCBridge(config);
            } else if (config.connection.protocolVersion === 3) {
                this._bridge = new GW3Bridge(config);
            } else {
                throw new Error("To use the Contexts library you must run in the"
                    + " HTML Container or using a connection to Gateway v3.");
            }
        } catch (err) {
            throw err;
        }
    }

    public all(): string[] {
        return this._bridge.all();
    }

    /**
     * Updates a context with some object. The object properties will replace the context properties, any other
     * context properties will remain in the context. If the context does not exists the update call will create it.
     *
     * @example
     * // if theme does not exists creates a context called theme with initial value
     * glue.contexts.update("theme", {font:10, font-family:"Arial"})
     *
     * // increases font to 11, after that call context is {font:10, font-family:"Arial"}
     * glue.contexts.update("theme", {font:11})
     *
     * @function
     * @param name Name of the context to be updated
     * @param data The object that will be applied to the context
     */
    public update(name: Glue42Core.Contexts.ContextName, delta: any): Promise<void> {
        this.checkName(name);

        return this._bridge.update(name, delta);
    }

    /**
     * Replaces a context
     * @function
     * @param name Name of the context to be updated
     * @param data The object that will be applied to the context
     */
    public set(name: Glue42Core.Contexts.ContextName, data: any): Promise<void> {
        this.checkName(name);

        return this._bridge.set(name, data);
    }

    /**
     * Subscribe for context events
     *
     * NB: This method publishes an initial snapshot on subscription.
     * To unsubscribe from within the callback, use the unsubscribe argument
     * of the callback, since the method itself may not have returned and the returned
     * callback is not available in the calling code.
     *
     * @function
     *
     * @param name name of the context to subscribe for
     * @param callback function that will receive updates.
     * @returns Function execute the returned function to unsubscribe
     */
    public subscribe(
        name: Glue42Core.Contexts.ContextName,
        callback: (data: any, delta: any, removed: string[], unsubscribe: () => void, extraData?: any) => void): Promise<() => void> {

        this.checkName(name);

        return this._bridge
            .subscribe(name, (data: any, delta: any, removed: string[], key: Glue42Core.Contexts.ContextSubscriptionKey, extraData?: any) => callback(data, delta, removed, () => this._bridge.unsubscribe(key), extraData))
            .then((key) =>
                () => {
                    this._bridge.unsubscribe(key);
                });

    }

    /**
     * Return a context's data immediately, (or asynchronously as soon as any becomes available,
     * if 'resolveImmediately' is false)
     */
    public get(
        name: Glue42Core.Contexts.ContextName,
        resolveImmediately?: boolean): Promise<any> {
        if (resolveImmediately === false) {
            resolveImmediately = true;
        }
        return this._bridge.get(name, resolveImmediately);
    }

    public ready(): Promise<any> {
        return Promise.resolve(this);
    }

    private checkName(name: Glue42Core.Contexts.ContextName) {
        if (typeof name !== "string" ||
            name === "") {
            throw new Error("'name' must be non-empty string, got '" + name + "'");
        }
    }
}
