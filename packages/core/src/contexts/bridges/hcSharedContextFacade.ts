import { Glue42Core } from "../../../glue";

export interface HCSharedContextFacade {

    all: () => { keys: Glue42Core.Contexts.ContextName[] };

    update(name: Glue42Core.Contexts.ContextName, data: any): void;

    set(name: Glue42Core.Contexts.ContextName, data: string): void;

    subscribe(name: Glue42Core.Contexts.ContextName, callback: (update: any, delta: any, removed: string[]) => void): Glue42Core.Contexts.ContextSubscriptionKey;

    unsubscribe(key: Glue42Core.Contexts.ContextSubscriptionKey): void;
}
