import {Glue42Core} from "../../../../glue";
import Helpers from "../../helpers";

import MetricTypes from "../const/metric-types";
import {Protocol} from "../../types";

export default function countMetric(definition: Glue42Core.Metrics.MetricDefinition, parent: Glue42Core.Metrics.System, transport: Protocol, value: number): Glue42Core.Metrics.CountMetric {
    Helpers.validate(definition, parent, transport);

    const _transport: Protocol = transport;
    let _value: number = value || 0;
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

    const type: number = MetricTypes.COUNT;

    function update(newValue: any) {
        _value = newValue;
        _transport.updateMetric(me);
        // NOTE: Optionally return the updated metric here.
    }

    function getValueType(): void {
        return undefined;
    }

    function incrementBy(num: number): void {
        update(_value + num);
    }

    function increment(): void {
        incrementBy(1);
    }

    function decrement(): void {
        incrementBy(-1);
    }

    function decrementBy(num: number): void {
        incrementBy(num * -1);
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

        get path() {
            return _path;
        },

        get value() {
            return _value;
        },

        update,
        getValueType,
        incrementBy,
        increment,
        decrement,
        decrementBy,
    };
    _transport.createMetric(me);

    return me;
}
