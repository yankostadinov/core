import { Glue42Core } from "../../../glue";
import { ContextBridge } from "../contextBridge";
import { HCSharedContextFacade } from "./hcSharedContextFacade";

declare const Promise: any; // make Promise.resolve compile on ES5

export class HCBridge implements ContextBridge {
    // html-container\HtmlContainer\HtmlContainer\JavaScript\SharedContexts\JsSharedContextFacade.cs
    private _facade: HCSharedContextFacade;

    public constructor(config: Glue42Core.Contexts.ContextsConfig) {
        this._facade = (window as any).htmlContainer.sharedContextFacade as HCSharedContextFacade;
    }

    public all(): Glue42Core.Contexts.ContextName[] {
        const allObj = this._facade.all();
        if (!allObj || !allObj.keys) {
            return [];
        }
        return allObj.keys;
    }

    public update(name: Glue42Core.Contexts.ContextName, delta: any): Promise<void> {
        this._facade.update(name, delta);
        return Promise.resolve();
    }

    public set(name: Glue42Core.Contexts.ContextName, data: any): Promise<void> {
        this._facade.set(name, data);
        return Promise.resolve();
    }

    public subscribe(name: Glue42Core.Contexts.ContextName, callback: (data: any, delta: any, removed: string[], key: Glue42Core.Contexts.ContextSubscriptionKey) => void): Promise<Glue42Core.Contexts.ContextSubscriptionKey> {

        // NB: this method (and the _facade call) sends snapshot on subscription
        let snapshot: {} = null;
        const key = this._facade.subscribe(name, (data, delta, removed) => {
            if (!key && key !== 0) {
                // getting snapshot inside the subscribe method
                // can't invoke callback since we don't have 'key' yet
                // will do that after method returns
                snapshot = data;
                return;
            }
            callback(data, delta, removed, key);
        });

        if (snapshot) {
            callback(snapshot, snapshot, [], key);
            snapshot = null;
        }

        return Promise.resolve(key);
    }

    /**
     * Return a context's data asynchronously as soon as any becomes available
     */
    public get(name: Glue42Core.Contexts.ContextName, resolveImmediately: boolean): Promise<any> {
        if (resolveImmediately) {
            throw new Error("resolveImmediately not supported in HtmlContainer");
        }

        return new Promise(async (resolve: any, reject: any) => {
            // HC sends a snapshot on subscription
            this.subscribe(name, (data, un) => {
                this.unsubscribe(un);
                resolve(data);
            });
        });
    }

    public unsubscribe(key: Glue42Core.Contexts.ContextSubscriptionKey): void {
        this._facade.unsubscribe(key);
    }
}
