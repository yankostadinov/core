import ServerProtocol from "./server";
import ClientProtocol from "./client";
import { Glue42Core } from "../../../../glue";
import ClientRepository from "../../client/repository";
import ServerRepository from "../../server/repository";
import AGMImpl from "../../agm";
import { Protocol } from "../../types";

export default function (instance: Glue42Core.Interop.Instance, connection: Glue42Core.Connection.GW3Connection, clientRepository: ClientRepository, serverRepository: ServerRepository, libConfig: Glue42Core.AGM.Settings, getAGM: () => AGMImpl): Promise<Protocol> {
    const logger = libConfig.logger.subLogger("gw3-protocol");
    let resolveReadyPromise: (p: Protocol) => void;

    const readyPromise = new Promise<Protocol>((resolve) => {
        resolveReadyPromise = resolve;
    });

    // start domain join handshake
    const session = connection.domain("agm", logger.subLogger("domain"), ["subscribed"]);
    const server = new ServerProtocol(session, clientRepository, serverRepository, logger.subLogger("server"));
    const client = new ClientProtocol(session, clientRepository, logger.subLogger("client"));

    function handleReconnect() {
        // we're reconnecting
        logger.info("reconnected - will replay registered methods and subscriptions");

        // TODO - re-subscribe for streams
        const existingSubscriptions = client.drainSubscriptions();
        existingSubscriptions.forEach((sub) => {
            const methodInfo = sub.method.info;
            const params = Object.assign({}, sub.params);
            getAGM().client.subscribe(methodInfo, params, undefined, undefined, sub);
        });

        // server side
        const registeredMethods = serverRepository.getList();
        serverRepository.reset();

        // replay server methods
        for (const method of registeredMethods) {
            const def = method.definition;
            if (method.stream) {
                // streaming method
                getAGM().server.createStream(def, method.streamCallbacks, undefined, undefined, method.stream);
            } else if (method.theFunction.userCallback) {
                getAGM().register(def, method.theFunction.userCallback);
            } else if (method.theFunction.userCallbackAsync) {
                getAGM().registerAsync(def, method.theFunction.userCallbackAsync);
            }
        }
    }

    function handleInitialJoin() {

        resolveReadyPromise({
            client,
            server,
        });

        resolveReadyPromise = undefined;
    }

    session.onLeft(() => {
        clientRepository.reset();
    });

    session.onJoined((reconnect) => {
        // add our server
        clientRepository.addServer(instance, connection.peerId);

        if (reconnect) {
            handleReconnect();
        } else {
            handleInitialJoin();
        }
    });

    session.join();

    return readyPromise;
}
