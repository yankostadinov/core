import Client from "./client/client";
import Server from "./server/server";
import { Protocol, SubscribeError } from "./types";
import { Glue42Core } from "../../glue";
import ClientRepository from "./client/repository";
import ServerRepository from "./server/repository";
import { UnsubscribeFunction } from "callback-registry";
import { InstanceWrapper } from "./instance";

export default class AGMImpl implements Glue42Core.AGM.API {

    public client: Client;
    public server: Server;
    public instance: Glue42Core.AGM.Instance;

    constructor(protocol: Protocol, clientRepository: ClientRepository, serverRepository: ServerRepository, instance: Glue42Core.Interop.Instance, configuration: Glue42Core.AGM.Settings) {
        this.client = new Client(protocol, clientRepository, instance, configuration);
        this.server = new Server(protocol, serverRepository);
        this.instance = instance;
    }

    public serverRemoved(callback: (instance: Glue42Core.AGM.Instance, reason: string) => void): UnsubscribeFunction {
        return this.client.serverRemoved(callback);
    }

    public serverAdded(callback: (instance: Glue42Core.AGM.Instance) => void): UnsubscribeFunction {
        return this.client.serverAdded(callback);
    }

    public serverMethodRemoved(callback: (info: { server: Glue42Core.AGM.Instance; method: Glue42Core.AGM.MethodDefinition; }) => void): UnsubscribeFunction {
        return this.client.serverMethodRemoved(callback);
    }

    public serverMethodAdded(callback: (info: { server: Glue42Core.AGM.Instance; method: Glue42Core.AGM.MethodDefinition; }) => void): UnsubscribeFunction {
        return this.client.serverMethodAdded(callback);
    }

    public methodRemoved(callback: (def: Glue42Core.AGM.MethodDefinition) => void): UnsubscribeFunction {
        return this.client.methodRemoved(callback);
    }

    public methodAdded(callback: (def: Glue42Core.AGM.MethodDefinition) => void): UnsubscribeFunction {
        return this.client.methodAdded(callback);
    }

    public methodsForInstance(instance: Glue42Core.AGM.Instance): Glue42Core.AGM.MethodDefinition[] {
        return this.client.methodsForInstance(instance);
    }

    public methods(methodFilter: Glue42Core.AGM.MethodDefinition): Glue42Core.AGM.MethodDefinition[] {
        return this.client.methods(methodFilter);
    }

    public servers(methodFilter: Glue42Core.AGM.MethodDefinition): Glue42Core.AGM.Instance[] {
        return this.client.servers(methodFilter);
    }

    public subscribe(method: string, options: Glue42Core.AGM.SubscriptionParams, successCallback?: (subscription: Glue42Core.AGM.Subscription) => void, errorCallback?: (err: SubscribeError) => void): Promise<Glue42Core.AGM.Subscription> {
        return this.client.subscribe(method, options, successCallback, errorCallback);
    }

    public createStream(streamDef: string | Glue42Core.AGM.MethodDefinition, options: Glue42Core.AGM.StreamOptions, successCallback?: (args?: object) => void, errorCallback?: (error?: string | object) => void): Promise<Glue42Core.AGM.Stream> {
        return this.server.createStream(streamDef, options, successCallback, errorCallback);
    }

    public unregister(methodFilter: string | Glue42Core.AGM.MethodDefinition): Promise<void> {
        return this.server.unregister(methodFilter);
    }

    public registerAsync(methodDefinition: string | Glue42Core.AGM.MethodDefinition, callback: (args: object, caller: Glue42Core.AGM.Instance, successCallback: (args?: object) => void, errorCallback: (error?: string | object) => void) => void): Promise<void> {
        return this.server.registerAsync(methodDefinition, callback);
    }

    public register(methodDefinition: string | Glue42Core.AGM.MethodDefinition, callback: (args: object, caller: Glue42Core.AGM.Instance) => object): Promise<void> {
        return this.server.register(methodDefinition, callback);
    }

    public invoke(methodFilter: string | Glue42Core.AGM.MethodDefinition, argumentObj?: object, target?: Glue42Core.AGM.InstanceTarget | Glue42Core.AGM.Instance | Glue42Core.AGM.Instance[], additionalOptions?: Glue42Core.AGM.InvokeOptions, success?: (result: Glue42Core.AGM.InvocationResult<any>) => void, error?: (error: { method: Glue42Core.AGM.MethodDefinition; called_with: object; executed_by: Glue42Core.AGM.Instance; message: string; status: number; returned: object; }) => void): Promise<Glue42Core.AGM.InvocationResult<any>> {
        return this.client.invoke(methodFilter, argumentObj, target, additionalOptions, success, error);
    }

    public updateInstance(newInstance: any) {
        if (this.instance.machine === undefined) {
            this.instance.machine = newInstance.MachineName || newInstance.machine;
        }
        if (this.instance.user === undefined) {
            this.instance.user = newInstance.UserName || newInstance.user;
        }
        if (this.instance.environment === undefined) {
            this.instance.environment = newInstance.Environment || newInstance.environment;
        }
        if (this.instance.region === undefined) {
            this.instance.region = newInstance.Region || newInstance.region;
        }
    }
}
