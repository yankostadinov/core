import {Glue42Core} from "../../../../glue";
import Helpers from "../../helpers";
import MetricTypes from "../const/metric-types";
import {Protocol} from "../../types";

export default function numberMetric(definition: Glue42Core.Metrics.MetricDefinition, parent: Glue42Core.Metrics.System, transport: Protocol, value: number): Glue42Core.Metrics.NumberMetric {
    Helpers.validate(definition, parent, transport);

    const _transport: Protocol = transport;
    const _path = parent.path.slice(0);
    let _value: number = value || 0;

    const name = definition.name;
    const description = definition.description;
    const period = definition.period;
    const resolution = definition.resolution;
    const conflation: Glue42Core.Metrics.ConflationMode = definition.conflation;
    const system = parent;
    const repo = parent.repo;
    const id = `${parent.path}/${name}`;
    const type = MetricTypes.NUMBER;

    _path.push(parent.name);

    function update(newValue: number) {
        _value = newValue;
        _transport.updateMetric(me);
        // NOTE: Optionally return the updated metric here.
    }

    function getValueType(): void {
        return undefined;
    }

    function incrementBy(num: number) {
        update(_value + num);
    }

    function increment() {
        incrementBy(1);
    }

    function decrement() {
        incrementBy(-1);
    }

    function decrementBy(num: number) {
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
        conflation,

        get value() {
            return _value;
        },
        type,

        get path() {
            return _path;
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
