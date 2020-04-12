import { Glue42Core} from "../../../../../glue";
import MetricTypes from "../../const/metric-types";

function metricToMessage(metric: Glue42Core.Metrics.Metric) {
    const definition = getMetricDefinition(metric.name,
        metric.value,
        metric.path,
        metric.type,
        metric.description,
        metric.period,
        metric.resolution,
        metric.conflation);

    function getMetricDefinition(name: string, value: any, path: string[], type?: number, description?: string, period?: string, resolution?: string, conflation?: Glue42Core.Metrics.ConflationMode) {
        const _definition: any = {
            name,
            description,
            type: type ? type : getTypeFromValue(value),
            path,
            resolution,
            period,
            conflation,
        };

        if (_definition.type === MetricTypes.OBJECT) {
            _definition.Composite = Object.keys(value).reduce((arr: any[], key: string) => {
                const val = value[key];
                arr.push(getMetricDefinition(key, val, path));
                return arr;
            }, []);
        }

        return _definition;
    }

    function serializeValue(value: any, _metric?: Glue42Core.Metrics.Metric): any {
        if (value && value.constructor === Date) {
            return {
                value: {
                    type: _valueTypes.indexOf("date"),
                    value: value.valueOf(),
                    isArray: false,
                },
            };
        }

        if (typeof value === "object") {
            return {
                CompositeValue: Object.keys(value).reduce((arr: any[], key: string) => {
                    const val = serializeValue(value[key]);
                    val.InnerMetricName = key;
                    arr.push(val);
                    return arr;
                }, []),
            };
        }

        let valueType: any = _metric ? _metric.getValueType() : undefined;
        valueType = valueType || _valueTypes.indexOf(typeof value);

        return {
            value: {
                type: valueType,
                value,
                isArray: false,
            },
        };
    }

    function getTypeFromValue(value: any): number {
        const typeAsString = value.constructor === Date ? "timestamp" : typeof value;
        switch (typeAsString) {
            case "string":
                return MetricTypes.STRING;
            case "number":
                return MetricTypes.NUMBER;
            case "timestamp":
                return MetricTypes.TIMESTAMP;
            case "object":
                return MetricTypes.OBJECT;
        }
        return 0;
    }

    const _valueTypes = [
        "boolean",
        "int",
        "number",
        "long",
        "string",
        "date",
        "object",
    ];

    return {
        id: metric.id,
        instance: metric.repo.instance,
        definition,
        value: serializeValue(metric.value, metric),
    };
}

export { metricToMessage as default };
