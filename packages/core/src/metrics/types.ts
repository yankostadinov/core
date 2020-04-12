import { Glue42Core } from "../../glue";

export interface LocalConfig extends Glue42Core.Metrics.Settings {
    settings?: object;
}

export interface Protocol {
    init(repo: Glue42Core.Metrics.Repository): void;
    createSystem(system: Glue42Core.Metrics.System): void;
    updateSystem(metric: Glue42Core.Metrics.System, state: Glue42Core.Metrics.State): void;
    createMetric(metric: Glue42Core.Metrics.Metric): void;
    updateMetric(metric: Glue42Core.Metrics.Metric): void;
}
