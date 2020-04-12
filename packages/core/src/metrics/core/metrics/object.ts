import MetricTypes from "../const/metric-types";
import Helpers from "../../helpers";
import {Glue42Core} from "../../../../glue";
import {Protocol} from "../../types";

export default function objectMetric(definition: Glue42Core.Metrics.MetricDefinition, parent: Glue42Core.Metrics.System, transport: Protocol, value: any): Glue42Core.Metrics.ObjectMetric {
    Helpers.validate(definition, parent, transport);

    const _transport: Protocol = transport;
    const _value: any = value || "";
    const _path = parent.path.slice(0);

    _path.push(parent.name);

    const name: string = definition.name;

    const description: string = definition.description;

    const period: string = definition.period;

    const resolution: string = definition.resolution;

    const conflation: Glue42Core.Metrics.ConflationMode = definition.conflation;

    const system: Glue42Core.Metrics.System = parent;

    const repo: Glue42Core.Metrics.Repository = parent.repo;

    const id: string = `${parent.path}/${name}`;

    const type: number = MetricTypes.OBJECT;

    function update(newValue: any) {
        mergeValues(newValue);
        _transport.updateMetric(me);
        // NOTE: Optionally return the updated metric here.
    }

    function getValueType(): void {
        return undefined;
    }

    function mergeValues(values: any) {
       return Object.keys(_value).forEach((k) => {
           if (typeof values[k] !== "undefined") {
               _value[k] = values[k];
           }
       });
    }

    const me = {
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
        getValueType,
    };

    _transport.createMetric(me);

    return me;
}
