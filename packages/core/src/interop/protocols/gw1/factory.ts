import ServerProtocol from "./server";
import ClientProtocol from "./client";
import { Glue42Core } from "../../../../glue";
import { Protocol } from "../../types";
import ServerRepository from "../../server/repository";
import ClientRepository from "../../client/repository";
import AGMImpl from "../../agm";

export default function (instance: Glue42Core.AGM.Instance, connection: Glue42Core.Connection.API, clientRepository: ClientRepository, serverRepository: ServerRepository, configuration: Glue42Core.AGM.Settings, getAGM: () => AGMImpl): Promise<Protocol> {
    const unsubscribe = connection.on("agm", "Instance", (newInstance: any) => {
        getAGM().updateInstance(newInstance);
        connection.off(unsubscribe);
    });

    const server = new ServerProtocol(connection, instance, configuration, serverRepository);
    const client = new ClientProtocol(connection, instance, configuration, clientRepository);

    return new Promise<Protocol>((resolve) => {

        resolve({
            server,
            client,
        });
    });
}
