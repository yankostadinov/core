import { Glue42Core } from "../../glue";
import { removeEmptyValues, keysMatch } from "./utils";

interface SubscriptionEntry {
    subscription_id: string;
    topic: string;
    callback: (data: object, topic: string, source: object) => void;
    source?: object;
}

class Protocol implements Glue42Core.Bus.API {
    public connection: Glue42Core.Connection.API;
    public logger: Glue42Core.Logger.API;
    public peerId: string;
    public session: Glue42Core.Connection.GW3DomainSession;
    public subscriptions: SubscriptionEntry[];

    constructor(connection: Glue42Core.Connection.API, logger: Glue42Core.Logger.API, session: Glue42Core.Connection.GW3DomainSession) {
        this.connection = connection;
        this.logger = logger;
        this.session = session;
        this.peerId = (connection as Glue42Core.Connection.GW3Connection).peerId;
        this.subscriptions = [];
    }

    public publish = (topic: string, data: object, options?: Glue42Core.Bus.MessageOptions): void => {
        const { routingKey, target } = options || {} as any;
        const args = removeEmptyValues({
            type: "publish",
            topic,
            data,
            peer_id: this.peerId,
            routing_key: routingKey,
            target_identity: target
        });
        this.session.send(args);
    }

    public subscribe = (
        topic: string,
        callback: (data: object, topic: string, source: object) => void,
        options?: Glue42Core.Bus.MessageOptions
    ): Promise<Glue42Core.Bus.Subscription> => {
        return new Promise((resolve, reject) => {
            const { routingKey, target } = options || {} as any;
            const args = removeEmptyValues({
                type: "subscribe",
                topic,
                peer_id: this.peerId,
                routing_key: routingKey,
                source: target
            });

            this.session.send(args)
                .then((response: any) => {
                    const { subscription_id } = response;
                    this.subscriptions.push({ subscription_id, topic, callback, source: target });

                    resolve({
                        unsubscribe: () => {
                            this.session.send({ type: "unsubscribe", subscription_id, peer_id: this.peerId });
                            this.subscriptions = this.subscriptions.filter((s) => s.subscription_id !== subscription_id);
                            return Promise.resolve();
                        }
                    });
                })
                .catch((error: any) => reject(error));
        });
    }

    public watchOnEvent = () => {
        this.session.on("event", (args: any) => {
            const { data, subscription_id } = args;
            const source = args["publisher-identity"];
            const subscription = this.subscriptions.find((s) => s.subscription_id === subscription_id);

            if (subscription) {
                if (!subscription.source) {
                    subscription.callback(data, subscription.topic, source);
                } else {
                    if (keysMatch(subscription.source, source)) {
                        subscription.callback(data, subscription.topic, source);
                    }
                }
            }
        });
    }
}

export default function (connection: Glue42Core.Connection.API, logger: Glue42Core.Logger.API, session: Glue42Core.Connection.GW3DomainSession): Glue42Core.Bus.API {
    const protocol = new Protocol(connection, logger, session);
    protocol.watchOnEvent();
    return protocol;
}
