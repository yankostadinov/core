import { Transport } from "../types";
/**
 * Connection to HtmlContainer
 */
export default class HCTransport implements Transport {

    private connectionId = Math.floor(1e10 * Math.random()).toString();

    public send(message: string | object, product: string, type: string): Promise<void> {
        if (product === "metrics") {
            window.htmlContainer.metricsFacade.send(type, message);
        } else if (product === "log") {
            window.htmlContainer.loggingFacade.send(type, message);
        }
        return Promise.resolve(undefined);
    }

    public onConnectedChanged(callback: (connected: boolean) => void) {
        // always connected;
        callback(true);
    }

    public onMessage(callback: (msg: string) => void) {
        // dummy implementation
        // hc transports are one way only
    }

    public close() {
        // do nothing
    }

    public open() {
        // do nothing
        return Promise.resolve();
    }

    public reconnect() {
        return Promise.resolve();
    }
}
