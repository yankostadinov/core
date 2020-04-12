import {Glue42Core} from "../../../../glue";
import Helpers from "../../helpers";
import MetricTypes from "../const/metric-types";
import {Protocol} from "../../types";

export default function stringMetric(definition: Glue42Core.Metrics.MetricDefinition, parent: Glue42Core.Metrics.System, transport: Protocol, value: string): Glue42Core.Metrics.StringMetric {
    Helpers.validate(definition, parent, transport);

    const _transport: Protocol = transport;
    let _value: string = value || "";
    const _path: string[] =  parent.path.slice(0);
    _path.push(parent.name);

    const name: string = definition.name;
    const description: string = definition.description;
    const period: string = definition.period;
    const resolution: string = definition.resolution;
    const conflation: Glue42Core.Metrics.ConflationMode = definition.conflation;
    const system: Glue42Core.Metrics.System = parent;
    const repo: Glue42Core.Metrics.Repository = parent.repo;
    const id: string = `${parent.path}/${name}`;
    const type: number = MetricTypes.STRING;

    function update(newValue: string) {
        _value = newValue;
        _transport.updateMetric(me);
        // NOTE: Optionally return the updated metric here.
    }

    function getValueType(): void {
        return undefined;
    }

    const me: Glue42Core.Metrics.StringMetric = {
        name,
        description,
        period,
        resolution,
        system,
        repo,
        id,
        conflation,

        get value() {
            return _value;
        },

        get path() {
            return _path;
        },
        type,
        update,
        getValueType,
    };

    _transport.createMetric(me);

    return me;
}
