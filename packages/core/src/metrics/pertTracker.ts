import { Glue42Core } from "../../glue";

export class PerfTracker {

    private lastIndex = -1;

    private initialPublishTimeout = 10 * 1000; // 10 sec
    private publishInterval = 60 * 1000; // 60 sec

    constructor(private api: Glue42Core.Metrics.API) {
        if (typeof window !== "undefined" && window.performance) {
            const perfConfig = window?.glue42gd?.metrics?.performance;
            if (perfConfig) {
                this.initialPublishTimeout = perfConfig.initialPublishTimeout ?? this.initialPublishTimeout;
                this.publishInterval = perfConfig.publishInterval ?? this.publishInterval;
            }

            this.scheduleCollection();
        }
    }

    private scheduleCollection() {
        setTimeout(() => {
            this.collect();
            setInterval(() => {
                this.collect();
            }, this.publishInterval);
        }, this.initialPublishTimeout);
    }

    private collect() {
        try {
            this.collectMemory();
            this.collectEntries();
        } catch {
            // DO NOTHING
        }
    }

    private collectMemory() {
        // memory - use performance.memory
        const memory = (window.performance as any).memory;
        this.api.featureMetric("memory", "update", memory);
    }

    private collectEntries() {
        const allEntries = window.performance.getEntries();
        const newEntries = allEntries.slice(this.lastIndex + 1);
        for (const newEntry of newEntries) {
            let name = "";
            if (newEntry.constructor && newEntry.constructor.name) {
                name = newEntry.constructor.name;
            }
            this.api.featureMetric("performance", name, newEntry.entryType);
        }
    }
}
