import { InstanceWrapper } from "./instance";
import { Glue42Core } from "../../glue";

import nativeAgm from "./hc/native";
import gW1ProtocolFactory from "./protocols/gw1/factory";
import gW3ProtocolFactory from "./protocols/gw3/factory";
import AGMImpl from "./agm";
import { Protocol } from "./types";
import ClientRepository from "./client/repository";
import ServerRepository from "./server/repository";

export default (configuration: Glue42Core.AGM.Settings): Promise<Glue42Core.AGM.API> => {

    if (!configuration.forceGW && configuration.gdVersion === 2) {
        return nativeAgm(configuration);
    }

    if (typeof configuration === "undefined") {
        throw new Error("configuration is required");
    }

    if (typeof configuration.connection === "undefined") {
        throw new Error("configuration.connections is required");
    }

    const connection = configuration.connection;

    if (typeof configuration.methodResponseTimeout !== "number") {
        configuration.methodResponseTimeout = 30 * 1000;
    }
    if (typeof configuration.waitTimeoutMs !== "number") {
        configuration.waitTimeoutMs = 30 * 1000;
    }

    // Initialize our modules
    // TODO - FIX ME
    const clientRepository = new ClientRepository();
    const serverRepository = new ServerRepository();
    let protocolPromise: Promise<Protocol>;
    const instance = new InstanceWrapper(configuration.instance, connection as Glue42Core.Connection.GW3Connection);

    let agmImpl: AGMImpl;

    if (connection.protocolVersion === 3) {
        protocolPromise = gW3ProtocolFactory(instance.unwrap(), connection as Glue42Core.Connection.GW3Connection, clientRepository, serverRepository, configuration, () => agmImpl);
    } else {
        protocolPromise = gW1ProtocolFactory(instance.unwrap(), connection, clientRepository, serverRepository, configuration, () => agmImpl);
    }

    return new Promise<Glue42Core.AGM.API>((resolve, reject) => {
        // wait for protocol to resolve
        protocolPromise.then((protocol: Protocol) => {
            agmImpl = new AGMImpl(protocol, clientRepository, serverRepository, instance.unwrap(), configuration);
            InstanceWrapper.API = agmImpl;
            resolve(agmImpl);
        }).catch((err: string) => {
            reject(err);
        });
    });
};
