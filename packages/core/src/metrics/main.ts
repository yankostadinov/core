import { Glue42Core  } from "../../glue";
import gw3 from "./core/protocols/gw3/gw3";
import gw1 from "./core/protocols/gw1/gw1";
import repository from "./repository";
import { LocalConfig, Protocol } from "./types";

export default (settings: Glue42Core.Metrics.Settings): Glue42Core.Metrics.System => {
    const options: LocalConfig = {
        connection: settings.connection,
        identity: settings.identity,
        logger: settings.logger,
        heartbeatInterval: settings.heartbeatInterval,
        settings: {},
        clickStream: settings.clickStream,
    };

    if (!options.connection || typeof options.connection !== "object") {
        throw new Error("Connection is required parameter");
    }

    let _protocol: Protocol;

    if (options.connection.protocolVersion === 3) {
        _protocol = gw3(options.connection as Glue42Core.Connection.GW3Connection, settings);
    } else {
        // it is necessary to work in HC
        _protocol = gw1(options.connection, settings);
    }

    const repo = repository(options, _protocol);

    const rootSystem: Glue42Core.Metrics.System = repo.root;
    return rootSystem; // System
};
