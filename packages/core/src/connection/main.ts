import { Glue42Core } from "../../glue";
import BaseConnection from "./connection";
import gw3Protocol from "./protocols/gw3";
import HCProtocol from "./protocols/hc";
import WS from "./transports/ws";
import GW3ConnectionImpl from "./gw3Connection";
import GW1Protocol from "./protocols/gw1";
import HCTransport from "./transports/hc";
import { Protocol, Transport } from "./types";
import Inproc from "./transports/inproc";

/**
 * Check readme.md for detailed description
 */
export default (settings: Glue42Core.Connection.Settings): Glue42Core.Connection.API => {
    settings = settings || {};
    settings.reconnectAttempts = settings.reconnectAttempts || 10;
    settings.reconnectInterval = settings.reconnectInterval || 500;
    const connection = new BaseConnection(settings);

    const logger = settings.logger;
    if (!logger) {
        throw new Error("please pass a logger object");
    }

    // by default use gw1 protocol and hc transport
    let protocol: Protocol = new HCProtocol();
    let transport: Transport = new HCTransport();

    const outsideHC = settings.gdVersion !== 2 || settings.force;
    if (outsideHC) {
        if (settings.gw && settings.gw.facade && settings.protocolVersion === 3) {
            transport = new Inproc(settings.gw.facade, logger.subLogger("inproc"));
        } else if (settings.ws !== undefined) {
            transport = new WS(settings, logger.subLogger("ws"));
        } else {
            throw new Error("No connection information specified");
        }

        // if running in the browser - let's check which protocol version user wants
        if (settings.protocolVersion === 3) {
            const gw3Connection = new GW3ConnectionImpl(settings);
            const gw3Port = gw3Protocol(gw3Connection, settings, logger.subLogger("gw3"));
            gw3Connection.init(transport, gw3Port);
            return gw3Connection.toAPI();
        } else {
            protocol = new GW1Protocol(connection, settings);
        }
    }

    connection.init(transport, protocol);
    return connection.toAPI();
};
