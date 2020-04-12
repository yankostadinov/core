import { Facade } from "./facade";
import { Glue42Core } from "../../../glue";

export class Helpers {
    private dateTimeIdentifier: any;
    private lenOfIdentifier: any;

    constructor(public facade: Facade) {
        this.dateTimeIdentifier = facade.jsonValueDatePrefix;
        this.lenOfIdentifier = this.dateTimeIdentifier.length;
    }
    // helper function for parsing dates properly
    public agmParse(str: string) {
        return JSON.parse(str, (k, v) => {
            if (typeof v !== "string") {
                return v;
            }

            // pre-seed - this should be a bit faster than indexOf
            if (v[0] !== this.dateTimeIdentifier[0]) {
                return v;
            }

            if (v.indexOf(this.dateTimeIdentifier) !== 0) {
                return v;
            }

            const unixTimestampMs = v.substr(this.lenOfIdentifier);
            return new Date(parseFloat(unixTimestampMs));
        });
    }

    /**
     * Converts a target argument to object ready to be passed to Agm facade
     * @param target
     */
    public targetArgToObject(target: any) {

        target = target || "best";

        if (typeof target === "string") {
            if (target !== "all" && target !== "best") {
                throw new Error(`${target} is not a valid target. Valid targets are 'all' and 'best'`);
            }
            return { target };
        } else {
            if (!Array.isArray(target)) {
                target = [target];
            }

            target = target.map((e: any) => {
                return this.convertInstanceToRegex(e);
            });

            return { serverFilter: target };
        }
    }

    public convertInstanceToRegex(instance: any) {
        const instanceConverted: { [key: string]: any } = {};

        Object.keys(instance).forEach((key) => {
            const propValue = instance[key];
            instanceConverted[key] = propValue;

            if (typeof propValue === "undefined" || propValue === null) {
                return;
            }

            if (typeof propValue === "string" && propValue !== "") {
                // do exact matching if user passed a string
                instanceConverted[key] = "^" + instance[key] + "$";
            } else if (instance[key].constructor === RegExp) {
                instanceConverted[key] = instance[key].source;
            } else {
                instanceConverted[key] = instance[key];
            }
        });
        return instanceConverted;
    }

    public validateMethodInfo(methodInfo: Glue42Core.AGM.MethodDefinition) {
        if (typeof methodInfo === "undefined") {
            throw Error("methodInfo is required argument");
        }

        if (!methodInfo.name) {
            throw Error("methodInfo object must contain name property");
        }

        if (methodInfo.objectTypes) {
            (methodInfo as any).object_types = methodInfo.objectTypes;
        }

        if (methodInfo.displayName) {
            (methodInfo as any).display_name = methodInfo.displayName;
        }
    }

    public stringToObject(param: any, stringPropName: string) {
        if (typeof param === "string") {
            const obj: { [key: string]: any } = {};
            obj[stringPropName] = param;
            return obj;
        }

        return param;
    }
}
