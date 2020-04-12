import { Glue42Core } from "../../../glue";

export interface Facade {
    protocolVersion: number;
    jsonValueDatePrefix: string;
    initAsync(cfg: string, success: (i: Glue42Core.AGM.Instance) => void, error: (err: string) => void): void;
    init(cfg: string): Glue42Core.AGM.Instance;

    register(method: string, handler: ((args: string, caller: Glue42Core.AGM.Instance) => string) | ((args: object, caller: Glue42Core.AGM.Instance) => void | object), returnAsJson?: boolean): void;
    registerAsync(method: object, callback: (args: any, instance: Glue42Core.AGM.Instance, tracker: any) => void): void;

    unregister(name: string): void;

    invoke(method: string, args: string, target: string, options: string, success: (result: any) => void, error: (err: string) => void): void;
    invoke2(method: string, args: string, target: string, options: string, success: (result: any) => void, error: (err: string) => void): void;

    methodAdded(callback: (method: Glue42Core.AGM.MethodDefinition) => void): void;
    methodRemoved(callback: (method: Glue42Core.AGM.MethodDefinition) => void): void;

    serverAdded(callback: (server: Glue42Core.AGM.Instance) => void): void;
    serverRemoved(callback: (server: Glue42Core.AGM.Instance) => void): void;

    serverMethodAdded(callback: (info: { server: Glue42Core.AGM.Instance, method: Glue42Core.AGM.MethodDefinition }) => void): void;
    serverMethodRemoved(callback: (info: {server: Glue42Core.AGM.Instance, method: Glue42Core.AGM.MethodDefinition}) => void): void;

    methodsForInstance(instance: string): string;

    servers(filter?: string): string;
    methods(filter?: string): string;

    subscribe2(name: string, params: string, success: (sub: Glue42Core.AGM.Subscription) => void, error: (err: string) => void): void;

    createStream2(methodDefinition: string,
                  subscriptionRequestHandler: (request: Glue42Core.AGM.SubscriptionRequest) => void,
                  subscriptionAddedHandler: (request: Glue42Core.AGM.StreamSubscription) => void,
                  subscriptionRemovedHandler: (request: Glue42Core.AGM.StreamSubscription) => void,
                  success: (stream: Glue42Core.AGM.Stream) => void,
                  error: (err: string) => void): void;
}
