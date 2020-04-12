import Helpers from "../../helpers";
import {Protocol} from "../../types";
import MetricTypes from "../const/metric-types";
import {Glue42Core} from "../../../../glue";

export default function timespanMetric(definition: Glue42Core.Metrics.MetricDefinition, parent: Glue42Core.Metrics.System, transport: Protocol, value: any): Glue42Core.Metrics.TimespanMetric {
    Helpers.validate(definition, parent, transport);

    const _transport: Protocol = transport;
    let _value: any = value || "";
    const _path: string[] = parent.path.slice(0);
    _path.push(parent.name);

    const name: string = definition.name;
    const description: string = definition.description;
    const period: string = definition.period;
    const resolution: string = definition.resolution;
    const conflation: Glue42Core.Metrics.ConflationMode = definition.conflation;
    const system: Glue42Core.Metrics.System = parent;
    const repo: Glue42Core.Metrics.Repository = parent.repo;
    const id: string = `${parent.path}/${name}`;
    const type: number = MetricTypes.TIMESPAN;

    function update(newValue: any): void {
        _value = newValue;
        _transport.updateMetric(me);
        // NOTE: Optionally return the updated metric here.
    }

    function start(): void {
        update(true);
    }

    function stop(): void {
        update(false);
    }

    function getValueType(): void {
        return undefined;
    }

    const me: Glue42Core.Metrics.TimespanMetric = {
        name,
        description,
        period,
        resolution,
        system,
        repo,
        id,
        type,
        conflation,

        get value() {
            return _value;
        },

        get path() {
            return _path;
        },
        update,
        start,
        stop,
        getValueType,
    };

    _transport.createMetric(me);

    return me;
}
