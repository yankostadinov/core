import { Glue42Core } from "../../../glue";
import promisify from "../helpers/promisify";
import { Facade } from "./facade";
import { Helpers } from "./helpers";
import { SubscribeError } from "../types";

export class NativeAGM implements Glue42Core.AGM.API {
    private protocolVersion: number;

    constructor(public instance: Glue42Core.AGM.Instance, private helpers: Helpers, private agmFacade: Facade) {
        this.protocolVersion = this.agmFacade.protocolVersion;
    }

    public register(name: string | Glue42Core.AGM.MethodDefinition, handler: (args: object, caller: Glue42Core.AGM.Instance) => void | object): Promise<void> {
        const methodInfoAsObject = this.helpers.stringToObject(name, "name");
        this.helpers.validateMethodInfo(methodInfoAsObject);

        if (this.protocolVersion && this.protocolVersion >= 3) {
            // for newer HC use the version where we don't pass arguments as JSON (because of different issues)
            this.agmFacade.register(JSON.stringify(methodInfoAsObject),
                handler,
                true); // return as objects
        } else {
            this.agmFacade.register(JSON.stringify(methodInfoAsObject),
                (arg: string, caller: Glue42Core.AGM.Instance): string => {
                    const methodResult = handler(JSON.parse(arg), caller);
                    return JSON.stringify(methodResult);
                });
        }
        return Promise.resolve();
    }

    public registerAsync(name: string | Glue42Core.AGM.MethodDefinition, handler: (args: object, caller: Glue42Core.AGM.Instance, successCallback: (args?: object) => void, errorCallback: (error?: string | object) => void) => void): Promise<void> {
        if (!this.agmFacade.registerAsync) {
            throw new Error("not supported in that version of HtmlContainer");
        }

        const methodInfoAsObject = this.helpers.stringToObject(name, "name");
        this.helpers.validateMethodInfo(methodInfoAsObject);

        this.agmFacade.registerAsync(methodInfoAsObject,
            (args, instance, tracker) => {
                // execute the user callback
                handler(args,
                    instance,
                    (successArgs) => {
                        tracker.success(successArgs);
                    },
                    (error) => {
                        tracker.error(error);
                    });
            });

        return Promise.resolve();
    }

    public unregister(definition: string | Glue42Core.AGM.MethodDefinition): void {
        this.agmFacade.unregister(JSON.stringify(this.helpers.stringToObject(definition, "name")));
    }
    public invoke(method: string | Glue42Core.AGM.MethodDefinition, argumentObj?: object, target?: Glue42Core.AGM.InstanceTarget, options?: Glue42Core.AGM.InvokeOptions, success?: Glue42Core.AGM.InvokeSuccessHandler<any>, error?: Glue42Core.AGM.InvokeErrorHandler): Promise<Glue42Core.AGM.InvocationResult<any>>;
    public invoke<T>(method: string | Glue42Core.AGM.MethodDefinition, argumentObj?: object, target?: Glue42Core.AGM.InstanceTarget, options?: Glue42Core.AGM.InvokeOptions, success?: Glue42Core.AGM.InvokeSuccessHandler<T>, error?: Glue42Core.AGM.InvokeErrorHandler): Promise<Glue42Core.AGM.InvocationResult<T>>;
    public invoke(method: any, argumentObj?: any, target?: any, options?: any, success?: any, error?: any) {
        const promise = new Promise<void>((resolve, reject) => {
            if (argumentObj === undefined) {
                argumentObj = {};
            }

            if (typeof argumentObj !== "object") {
                reject({ message: "The method arguments must be an object." });
            }

            if (options === undefined) {
                options = {};
            }

            target = this.helpers.targetArgToObject(target);

            if (this.agmFacade.invoke2) {
                // invoke ver2 - do not stringify arguments and result values
                this.agmFacade.invoke2(
                    JSON.stringify(this.helpers.stringToObject(method, "name")),
                    argumentObj,
                    JSON.stringify(target),
                    JSON.stringify(options),
                    (a) => {
                        resolve(a);
                    },
                    (err) => {
                        reject(err);
                    },
                );
            } else {
                let successProxy;
                let errorProxy;

                successProxy = (args: string) => {
                    const parsed = JSON.parse(args);
                    resolve(parsed);
                };
                errorProxy = (args: string) => {
                    const parsed = JSON.parse(args);
                    reject(parsed);
                };
                this.agmFacade.invoke(
                    JSON.stringify(this.helpers.stringToObject(method, "name")),
                    JSON.stringify(argumentObj),
                    JSON.stringify(target),
                    JSON.stringify(options),
                    successProxy,
                    errorProxy,
                );
            }
        });

        return promisify(promise, success, error);
    }

    public createStream(methodDefinition: string | Glue42Core.AGM.MethodDefinition, options?: Glue42Core.AGM.StreamOptions, successCallback?: (stream: Glue42Core.AGM.Stream) => void, errorCallback?: (error: any) => void): Promise<Glue42Core.AGM.Stream> {

        const promise = new Promise<Glue42Core.AGM.Stream>((resolve, reject) => {
            if (typeof methodDefinition === "string") {
                methodDefinition = {
                    name: methodDefinition,
                    getServers: () => [],
                };
            }

            if (!options) {
                options = {
                    subscriptionRequestHandler: undefined,
                    subscriptionAddedHandler: undefined,
                    subscriptionRemovedHandler: undefined,
                };
            }

            this.agmFacade.createStream2(
                JSON.stringify(methodDefinition),
                // TODO - wrap to transform params
                options.subscriptionRequestHandler,
                // TODO - wrap to transform params
                options.subscriptionAddedHandler,
                // TODO - wrap to transform params
                options.subscriptionRemovedHandler,
                // success handler
                (stream: Glue42Core.AGM.Stream) => {
                    resolve(stream);
                },
                // error handler
                (error: any) => {
                    reject(error);
                },
            );
        });
        return promisify(promise, successCallback, errorCallback);
    }
    public subscribe(methodDefinition: string | Glue42Core.AGM.MethodDefinition, parameters: Glue42Core.AGM.SubscriptionParams, successCallback?: (subscription: Glue42Core.AGM.Subscription) => void, errorCallback?: (error: SubscribeError) => void): Promise<Glue42Core.AGM.Subscription> {

        const promise = new Promise<Glue42Core.AGM.Subscription>((resolve, reject) => {
            if (typeof methodDefinition === "undefined") {
                reject("method definition param is required");
            }

            if (parameters === undefined) {
                parameters = {};
            }
            (parameters as any).args = JSON.stringify(parameters.arguments || {});
            (parameters as any).target = this.helpers.targetArgToObject(parameters.target);

            let name: string;
            if (typeof methodDefinition === "string") {
                name = methodDefinition;
            } else {
                name = methodDefinition.name;
            }
            this.agmFacade.subscribe2(name,
                JSON.stringify(parameters),
                (sub: Glue42Core.AGM.Subscription) => {
                    resolve(sub);
                },
                (error: any) => {
                    reject(error);
                },
            );
        });

        return promisify(promise, successCallback, errorCallback);
    }
    public servers(filter?: Glue42Core.AGM.MethodFilter): Glue42Core.AGM.Instance[] {
        const jsonResult = this.agmFacade.servers(JSON.stringify(this.helpers.stringToObject(filter, "name")));
        const parsedResult = this.helpers.agmParse(jsonResult);
        return parsedResult.map((server: Glue42Core.AGM.Instance) => {
            return this.transformServerObject(server);
        });
    }
    public methods(filter?: Glue42Core.AGM.MethodFilter): Glue42Core.AGM.MethodDefinition[] {
        const jsonResult = this.agmFacade.methods(JSON.stringify(this.helpers.stringToObject(filter, "name")));
        const parsedResult = this.helpers.agmParse(jsonResult);
        return parsedResult.map((method: Glue42Core.AGM.MethodDefinition) => {
            return this.transformMethodObject(method);
        });
    }
    public methodAdded(callback: (method: Glue42Core.AGM.MethodDefinition) => void): () => void {

        let subscribed = true;

        this.agmFacade.methodAdded((method) => {
            if (subscribed) {
                callback(this.transformMethodObject(method));
            }
        });

        return () => {
            subscribed = false;
        };
    }
    public methodRemoved(callback: (method: Glue42Core.AGM.MethodDefinition) => void): () => void {

        let subscribed = true;

        this.agmFacade.methodRemoved((method) => {
            if (subscribed) {
                callback(this.transformMethodObject(method));
            }
        });

        return () => {
            subscribed = false;
        };

    }
    public serverAdded(callback: (server: Glue42Core.AGM.Instance) => void): () => void {

        let subscribed = true;

        this.agmFacade.serverAdded((server) => {
            if (subscribed) {
                callback(this.transformServerObject(server));
            }
        });

        return () => {
            subscribed = false;
        };
    }
    public serverRemoved(callback: (server: Glue42Core.AGM.Instance) => void): () => void {

        let subscribed = true;

        this.agmFacade.serverRemoved((server) => {
            if (subscribed) {
                callback(this.transformServerObject(server));
            }
        });

        return () => {
            subscribed = false;
        };
    }
    public serverMethodAdded(callback: (info: { server: Glue42Core.AGM.Instance, method: Glue42Core.AGM.MethodDefinition }) => void): () => void {

        let subscribed = true;

        this.agmFacade.serverMethodAdded((info) => {
            if (subscribed) {
                callback({
                    server: this.transformServerObject(info.server),
                    method: this.transformMethodObject(info.method),
                });
            }
        });

        return () => {
            subscribed = false;
        };
    }
    public serverMethodRemoved(callback: (info: { server: Glue42Core.AGM.Instance, method: Glue42Core.AGM.MethodDefinition }) => void): () => void {

        let subscribed = true;

        this.agmFacade.serverMethodRemoved((info) => {
            if (subscribed) {
                callback({
                    server: this.transformServerObject(info.server),
                    method: this.transformMethodObject(info.method),
                });
            }
        });

        return () => {
            subscribed = false;
        };
    }

    public methodsForInstance(server: Glue42Core.AGM.Instance): Glue42Core.AGM.MethodDefinition[] {
        const jsonResult = this.agmFacade.methodsForInstance(JSON.stringify(server));
        const methods = this.helpers.agmParse(jsonResult);
        return methods.map(this.transformMethodObject);
    }

    private transformMethodObject(method: any) {
        if (!method) {
            return undefined;
        }

        if (!method.displayName) {
            method.displayName = method.display_name;
        }

        if (!method.objectTypes) {
            method.objectTypes = method.object_types;
        }

        method.getServers = () => {
            return this.servers(method.name);
        };

        return method;
    }

    private transformServerObject(server: Glue42Core.AGM.Instance) {
        if (!server) {
            return undefined;
        }
        server.getMethods = () => {
            return this.methodsForInstance(server);
        };

        server.getStreams = () => {
            return this.methodsForInstance(server).filter((method: Glue42Core.AGM.MethodDefinition) => {
                return method.supportsStreaming;
            });
        };

        return server;
    }

}
