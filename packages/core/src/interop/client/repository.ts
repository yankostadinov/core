/*
 * Repository holding servers and methods visible by this peer including those created by the peer itself.
 */
import { default as CallbackRegistryFactory, CallbackRegistry, UnsubscribeFunction } from "callback-registry";
import { Glue42Core } from "../../../glue";
import { ClientMethodInfo, ServerInfo, ClientMethodInfoProtocolState } from "./types";
import { InstanceWrapper } from "../instance";

export default class ClientRepository {

    // each server has format {id:'', info:{}, methods:{}}
    // where methods has format {id:'', info:{}}
    private servers: { [id: string]: ServerInfo } = {};

    // object keyed by method id - value is number of servers that offer that method
    private methodsCount: { [id: string]: number } = {};

    // store for callbacks
    private callbacks = CallbackRegistryFactory();

    // add a new server to internal collection
    public addServer(info: Glue42Core.AGM.Instance, serverId: string): string {
        const current = this.servers[serverId];
        if (current) {
            return current.id;
        }

        const serverEntry: ServerInfo = {
            id: serverId,
            info,
            methods: {},
            getInfoForUser: () => {
                return new InstanceWrapper(serverEntry.info).unwrap();
            },
        };

        this.servers[serverId] = serverEntry;
        this.callbacks.execute("onServerAdded", serverEntry);
        return serverId;
    }

    public removeServerById(id: string, reason?: string) {
        const server = this.servers[id];

        Object.keys(server.methods).forEach((methodId) => {
            this.removeServerMethod(id, methodId);
        });

        delete this.servers[id];
        this.callbacks.execute("onServerRemoved", server, reason);
    }

    public addServerMethod(serverId: string, method: Glue42Core.AGM.MethodDefinition, protocolState?: ClientMethodInfoProtocolState) {
        if (!protocolState) {
            protocolState = {};
        }
        const server = this.servers[serverId];
        if (!server) {
            throw new Error("server does not exists");
        }

        const methodId = this.createMethodId(method);

        // server already has that method
        if (server.methods[methodId]) {
            return;
        }

        const that = this;
        const methodEntity: ClientMethodInfo = {
            id: methodId,
            info: method,
            getInfoForUser: () => {
                const result = that.createUserMethodInfo(methodEntity.info);
                result.getServers = () => {
                    return that.getServersByMethod(methodId);
                };
                return result;
            },
            protocolState,
        };

        server.methods[methodId] = methodEntity;

        // increase the ref and notify listeners
        if (!this.methodsCount[methodId]) {
            this.methodsCount[methodId] = 0;
            this.callbacks.execute("onMethodAdded", methodEntity);
        }
        this.methodsCount[methodId] = this.methodsCount[methodId] + 1;
        this.callbacks.execute("onServerMethodAdded", server, methodEntity);
    }

    public createMethodId(methodInfo: Glue42Core.AGM.MethodDefinition) {
        // Setting properties to defaults:
        const accepts = methodInfo.accepts !== undefined ? methodInfo.accepts : "";
        const returns = methodInfo.returns !== undefined ? methodInfo.returns : "";
        return (methodInfo.name + accepts + returns).toLowerCase();
    }

    public removeServerMethod(serverId: string, methodId: string) {
        const server = this.servers[serverId];
        if (!server) {
            throw new Error("server does not exists");
        }

        const method = server.methods[methodId];
        delete server.methods[methodId];

        // update ref counting
        this.methodsCount[methodId] = this.methodsCount[methodId] - 1;
        if (this.methodsCount[methodId] === 0) {
            this.callbacks.execute("onMethodRemoved", method);
        }

        this.callbacks.execute("onServerMethodRemoved", server, method);
    }

    public getMethods(): ClientMethodInfo[] {
        const allMethods: { [key: string]: ClientMethodInfo } = {};
        Object.keys(this.servers).forEach((serverId) => {
            const server = this.servers[serverId];
            Object.keys(server.methods).forEach((methodId) => {
                const method: ClientMethodInfo = server.methods[methodId];
                allMethods[method.id] = method;
            });
        });

        const methodsAsArray = Object.keys(allMethods).map((id) => {
            return allMethods[id];
        });

        return methodsAsArray;
    }

    public getServers(): ServerInfo[] {
        const allServers: ServerInfo[] = [];
        Object.keys(this.servers).forEach((serverId) => {
            const server = this.servers[serverId];
            allServers.push(server);
        });

        return allServers;
    }

    public getServerMethodsById(serverId: string): ClientMethodInfo[] {
        const server = this.servers[serverId];

        return Object.keys(server.methods).map((id) => {
            return server.methods[id];
        });
    }

    public onServerAdded(callback: (server: ServerInfo) => void): UnsubscribeFunction {
        const unsubscribeFunc = this.callbacks.add("onServerAdded", callback);

        // because we need the servers shapshot before we exist this stack
        const serversWithMethodsToReplay = this.getServers();

        return this.returnUnsubWithDelayedReplay(unsubscribeFunc, serversWithMethodsToReplay, callback);
    }

    public onMethodAdded(callback: (method: ClientMethodInfo) => void): UnsubscribeFunction {
        const unsubscribeFunc = this.callbacks.add("onMethodAdded", callback);

        // because we need the servers shapshot before we return to the application code
        const methodsToReplay = this.getMethods();

        return this.returnUnsubWithDelayedReplay(unsubscribeFunc, methodsToReplay, callback);
    }

    public onServerMethodAdded(callback: (server: ServerInfo, method: ClientMethodInfo) => void): UnsubscribeFunction {
        const unsubscribeFunc = this.callbacks.add("onServerMethodAdded", callback);

        // because we want to interrupt the loop with the existing methods
        let unsubCalled = false;

        // because we need the servers shapshot before we return to the application code
        const servers = this.getServers();

        // because we want to have the unsub function before the callback is called with all existing methods
        setTimeout(() => {
            servers.forEach((server) => {
                const methods = server.methods;
                Object.keys(methods).forEach((methodId) => {
                    if (!unsubCalled) {
                        callback(server, methods[methodId]);
                    }
                });
            });
        }, 0);

        return () => {
            unsubCalled = true;
            unsubscribeFunc();
        };
    }

    public onMethodRemoved(callback: (method: ClientMethodInfo) => void): UnsubscribeFunction {
        const unsubscribeFunc = this.callbacks.add("onMethodRemoved", callback);

        return unsubscribeFunc;
    }

    public onServerRemoved(callback: (server: ServerInfo, reason: string) => void): UnsubscribeFunction {
        const unsubscribeFunc = this.callbacks.add("onServerRemoved", callback);

        return unsubscribeFunc;
    }

    public onServerMethodRemoved(callback: (server: ServerInfo, method: ClientMethodInfo) => void): UnsubscribeFunction {
        const unsubscribeFunc = this.callbacks.add("onServerMethodRemoved", callback);

        return unsubscribeFunc;
    }

    public getServerById(id: string) {
        return this.servers[id];
    }

    public reset() {
        Object.keys(this.servers).forEach((key) => {
            this.removeServerById(key, "reset");
        });

        this.servers = {};
        this.methodsCount = {};
    }

    /**
     * Transforms internal server object to user object
     */
    private createUserServerInfo(serverInfo: Glue42Core.AGM.Instance): Glue42Core.AGM.Instance {
        return {
            machine: serverInfo.machine,
            pid: serverInfo.pid,
            user: serverInfo.user,
            application: serverInfo.application,
            applicationName: serverInfo.applicationName,
            environment: serverInfo.environment,
            region: serverInfo.region,
            instance: serverInfo.instance,
            windowId: serverInfo.windowId,
            peerId: serverInfo.peerId,
            isLocal: serverInfo.isLocal,
            api: serverInfo.api
        };
    }

    /**
     * Transforms internal method object to user object
     */
    private createUserMethodInfo(methodInfo: Glue42Core.AGM.MethodDefinition): Glue42Core.AGM.MethodDefinition {
        const result = {
            name: methodInfo.name,
            accepts: methodInfo.accepts,
            returns: methodInfo.returns,
            description: methodInfo.description,
            displayName: methodInfo.displayName,
            objectTypes: methodInfo.objectTypes,
            supportsStreaming: methodInfo.supportsStreaming,
        };

        // now add some legacy stuff
        (result as any).object_types = methodInfo.objectTypes;
        (result as any).display_name = methodInfo.displayName;
        (result as any).version = methodInfo.version;

        return result;
    }

    private getServersByMethod(id: string): Glue42Core.AGM.Instance[] {
        const allServers: Glue42Core.AGM.Instance[] = [];
        Object.keys(this.servers).forEach((serverId) => {
            const server = this.servers[serverId];
            Object.keys(server.methods).forEach((methodId) => {
                if (methodId === id) {
                    allServers.push(server.getInfoForUser());
                }
            });
        });
        return allServers;
    }

    // collectionToReplay: because we need a shapshot before we exist this stack
    private returnUnsubWithDelayedReplay(unsubscribeFunc: UnsubscribeFunction, collectionToReplay: any[], callback: any) {

        // because we want to interrupt the loop with the existing methods
        let unsubCalled = false;

        // because we want to have the unsub function before the callback is called with all existing methods
        setTimeout(() => {
            collectionToReplay.forEach((item) => {
                if (!unsubCalled) {
                    callback(item);
                }
            });
        }, 0);

        return () => {
            unsubCalled = true;
            unsubscribeFunc();
        };
    }
}
