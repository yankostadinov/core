import { Glue42Core } from "../../../../../glue";
import metricToMessage from "./serializer";
import { Protocol } from "../../../types";

export default function (connection: Glue42Core.Connection.API, config: Glue42Core.Metrics.Settings): Protocol {
    const DEFAULT_HEARTBEAT_INTERVAL: number = 3000;
    let heartbeatTimer: any;

    if (!connection || typeof connection !== "object") {
        throw new Error("Connection is required parameter");
    }

    const _connection = connection;
    const heartbeatInterval: number = config.heartbeatInterval || DEFAULT_HEARTBEAT_INTERVAL;

    const send = (type: any, message: any) => {
        _connection.send("metrics", type, message);
    };

    function sendFull(repo: Glue42Core.Metrics.Repository) {
        if (!repo.root) {
            return;
        }

        if (repo.root.subSystems.length === 0) {
            return;
        }

        sendFullSystem(repo.root);
    }

    function sendFullSystem(system: Glue42Core.Metrics.System) {
        createSystem(system);

        system.subSystems.forEach((sub: Glue42Core.Metrics.System) => {
            sendFullSystem(sub);
        });

        system.metrics.forEach((metric: Glue42Core.Metrics.Metric) => {
            createMetric(metric);
        });
    }

    function heartbeat(repo: Glue42Core.Metrics.Repository) {
        send("HeartbeatMetrics", {
            publishingInterval: heartbeatInterval,
            instance: repo.instance,
        });
    }

    function createSystem(system: Glue42Core.Metrics.System) {
        if (system.parent !== undefined) {
            send("CreateMetricSystem", {
                id: system.id,
                instance: system.repo.instance,
                definition: {
                    name: system.name,
                    description: system.description,
                    path: system.path,
                },
            });
        }
    }

    function updateSystem(system: Glue42Core.Metrics.System, state: Glue42Core.Metrics.State) {
        send("UpdateMetricSystem", {
            id: system.id,
            instance: system.repo.instance,
            state,
        });
    }

    function createMetric(metric: Glue42Core.Metrics.Metric) {
        send("CreateMetric", metricToMessage(metric));
    }

    function updateMetric(metric: Glue42Core.Metrics.Metric) {
        send("UpdateMetric", metricToMessage(metric));
    }

    function init(repo: Glue42Core.Metrics.Repository) {
        heartbeat(repo);

        _connection.on("metrics", "MetricsSnapshotRequest", (instanceInfo: { Instance: string }) => {
            if (instanceInfo.Instance !== repo.instance) {
                return;
            }
            sendFull(repo);
        });

        _connection.disconnected(() => clearInterval(heartbeatTimer));

        if (typeof window !== "undefined" && typeof window.htmlContainer === "undefined") {
            heartbeatTimer = setInterval(() => {
                heartbeat(repo);
            }, heartbeatInterval);
        }
    }

    const me: Protocol = {
        createSystem,
        updateSystem,
        createMetric,
        updateMetric,
        init,
    };

    return me;
}
