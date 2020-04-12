import { default as addressMetricFactory } from "./core/metrics/address";
import { default as countMetricFactory } from "./core/metrics/count";
import { default as numberMetricFactory } from "./core/metrics/number";
import { default as objectMetricFactory } from "./core/metrics/object";
import { default as rateMetricFactory } from "./core/metrics/rate";
import { default as statisticsMetricFactory } from "./core/metrics/statistics";
import { default as stringMetricFactory } from "./core/metrics/string";
import { default as timespanMetricFactory } from "./core/metrics/timespan";
import { default as timestampMetricFactory } from "./core/metrics/timestamp";

import { Glue42Core } from "./../../glue";
import MetricTypes from "./core/const/metric-types";
import { Protocol } from "./types";

export default function system(name: string, repo: Glue42Core.Metrics.Repository, protocol: Protocol, parent?: Glue42Core.Metrics.System, description?: any): Glue42Core.Metrics.System {
    // Validation
    // if (!name) throw new Error("Name is required. ");

    if (!repo) {
        throw new Error("Repository is required");
    }

    if (!protocol) {
        throw new Error("Transport is required");
    }

    const _transport: Protocol = protocol;

    const _name: string = name;
    const _description: string = description || "";
    const _repo: Glue42Core.Metrics.Repository = repo;
    const _parent: Glue42Core.Metrics.System = parent;
    const _path: string[] = _buildPath(parent);
    let _state: Glue42Core.Metrics.State = {};

    const id: string = _arrayToString(_path, "/") + name;
    const identity: Glue42Core.Metrics.Identity = repo.identity;
    const root: Glue42Core.Metrics.System = repo.root;
    const _subSystems: Glue42Core.Metrics.System[] = [];
    const _metrics: Glue42Core.Metrics.Metric[] = [];

    function subSystem(nameSystem: string, descriptionSystem?: string): Glue42Core.Metrics.System {
        if (!nameSystem || nameSystem.length === 0) {
            throw new Error("name is required");
        }

        const match: Glue42Core.Metrics.System[] = _subSystems.filter((s) => s.name === nameSystem);
        if (match.length > 0) {
            return match[0];
        }

        const _system: Glue42Core.Metrics.System = system(nameSystem, _repo, _transport, me, descriptionSystem);
        _subSystems.push(_system);
        return _system;
    }

    function setState(state: number, stateDescription?: string): void {
        _state = { state, description: stateDescription };
        _transport.updateSystem(me, _state);
    }

    function stringMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: string): Glue42Core.Metrics.StringMetric {
        return _getOrCreateMetric.call(me, definition, MetricTypes.STRING, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => stringMetricFactory(metricDef, me, _transport, value));
    }

    function numberMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: number): Glue42Core.Metrics.NumberMetric {
        return _getOrCreateMetric.call(me, definition, MetricTypes.NUMBER, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => numberMetricFactory(metricDef, me, _transport, value));
    }

    function countMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: any): Glue42Core.Metrics.CountMetric {
        return _getOrCreateMetric.call(this, definition, MetricTypes.COUNT, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => countMetricFactory(metricDef, me, _transport, value));
    }

    function addressMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: any): Glue42Core.Metrics.AddressMetric {
        return _getOrCreateMetric.call(this, definition, MetricTypes.ADDRESS, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => addressMetricFactory(metricDef, me, _transport, value));
    }

    function objectMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: any): Glue42Core.Metrics.ObjectMetric {
        return _getOrCreateMetric.call(this, definition, MetricTypes.OBJECT, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => objectMetricFactory(metricDef, me, _transport, value));
    }

    function timespanMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: any): Glue42Core.Metrics.TimespanMetric {
        return _getOrCreateMetric.call(this, definition, MetricTypes.TIMESPAN, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => timespanMetricFactory(metricDef, me, _transport, value));
    }

    function timestampMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: any): Glue42Core.Metrics.TimestampMetric {
        return _getOrCreateMetric.call(this, definition, MetricTypes.TIMESTAMP, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => timestampMetricFactory(metricDef, me, _transport, value));
    }

    function rateMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: any): Glue42Core.Metrics.RateMetric {
        return _getOrCreateMetric.call(this, definition, MetricTypes.RATE, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => rateMetricFactory(metricDef, me, _transport, value));
    }

    function statisticsMetric(definition: Glue42Core.Metrics.MetricDefinition | string, value: any): Glue42Core.Metrics.StatisticsMetric {
        return _getOrCreateMetric.call(this, definition, MetricTypes.STATISTICS, value, (metricDef: Glue42Core.Metrics.MetricDefinition) => statisticsMetricFactory(metricDef, me, _transport, value));
    }

    function _unionToMetricDef(def: string | Glue42Core.Metrics.MetricDefinition): Glue42Core.Metrics.MetricDefinition {
        let metricDefinition: Glue42Core.Metrics.MetricDefinition = {};

        // NOTE: Handle undefined
        if (typeof def === "string") {
            metricDefinition.name = def;
        } else {
            metricDefinition = def;
        }

        if (metricDefinition.name === undefined) {
            throw new Error("Metric name is required");
        }

        return metricDefinition;
    }

    function _getOrCreateMetric(definition: Glue42Core.Metrics.MetricDefinition, expectedType: number, value: any, createMetric: (metricDef: Glue42Core.Metrics.MetricDefinition, me?: Glue42Core.Metrics.System, _transport?: Protocol, value?: any) => Glue42Core.Metrics.Metric) {
        const metricDefinition: Glue42Core.Metrics.MetricDefinition = _unionToMetricDef(definition);
        const matching: Glue42Core.Metrics.Metric[] = _metrics.filter((shadowedMetric) => shadowedMetric.name === metricDefinition.name);

        if (matching.length > 0) {
            const existing: Glue42Core.Metrics.Metric = matching[0];
            if (existing.type !== expectedType) {
                // NOTE: Extend the error with the already defined metric?
                throw new Error(`A metric named ${metricDefinition.name} is already defined with different type.`);
            }

            if (typeof value !== "undefined") {
                existing.update(value);
            }

            return existing;
        }

        const metric: Glue42Core.Metrics.Metric = createMetric(metricDefinition);
        _metrics.push(metric);
        return metric;
    }

    function _buildPath(shadowedSystem: Glue42Core.Metrics.System): string[] {
        if (!shadowedSystem || !shadowedSystem.parent) {
            return [];
        }

        const path = _buildPath(shadowedSystem.parent);
        path.push(shadowedSystem.name);
        return path;
    }

    function _arrayToString(path: string[], separator: string) {
        return ((path && path.length > 0) ? path.join(separator) : "");
    }

    function getAggregateState(): Glue42Core.Metrics.SystemStateInfo[] {
        const aggState: Glue42Core.Metrics.SystemStateInfo[] = [];
        if (Object.keys(_state).length > 0) {
            aggState.push({
                name: _name,
                path: _path,
                state: _state.state,
                description: _state.description,
            });
        }

        _subSystems.forEach((shadowedSubSystem) => {
            const result = shadowedSubSystem.getAggregateState();
            if (result.length > 0) {
                aggState.push(...result);
            }
        });

        return aggState;
    }

    const me: Glue42Core.Metrics.System = {
        get name() {
            return _name;
        },

        get description() {
            return _description;
        },

        get repo() {
            return _repo;
        },

        get parent() {
            return _parent;
        },
        path: _path,
        id,
        identity,
        root,

        get subSystems() {
            return _subSystems;
        },

        get metrics() {
            return _metrics;
        },
        subSystem,
        getState: () => {
            return _state;
        },
        setState,
        stringMetric,
        statisticsMetric,
        rateMetric,
        timestampMetric,
        timespanMetric,
        objectMetric,
        addressMetric,
        countMetric,
        numberMetric,
        getAggregateState,
    };

    _transport.createSystem(me);

    return me;
}
