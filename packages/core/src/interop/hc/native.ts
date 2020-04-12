import { Glue42Core } from "../../../glue";
import { NativeAGM } from "./agm";
import { Facade } from "./facade";
import { Helpers } from "./helpers";

export default function(configuration: Glue42Core.AGM.Settings): Promise<Glue42Core.AGM.API> {

    // date parsing
    const facade: Facade = window.htmlContainer.jsAgmFacade;
    const cfgAsString = createConfig(configuration);

    return new Promise<Glue42Core.AGM.API>((resolve, reject) => {

        // create new AGM façade for this instance
        const successInit = (instance: Glue42Core.AGM.Instance) => {

            const nativeAGM = new NativeAGM(instance,
                new Helpers(facade),
                facade);

            // deprecated API
            (nativeAGM as any).create_stream = nativeAGM.createStream;
            (nativeAGM as any).methods_for_instance = nativeAGM.methodsForInstance;
            (nativeAGM as any).method_added = nativeAGM.methodAdded;
            (nativeAGM as any).method_removed = nativeAGM.methodRemoved;
            (nativeAGM as any).server_added = nativeAGM.serverAdded;
            (nativeAGM as any).server_removed = nativeAGM.serverRemoved;
            (nativeAGM as any).server_method_added = nativeAGM.serverMethodAdded;
            (nativeAGM as any).server_method_removed = nativeAGM.serverMethodRemoved;

            resolve(nativeAGM);
        };

        if (facade.protocolVersion && facade.protocolVersion >= 5 && facade.initAsync) {
            facade.initAsync(cfgAsString,
                successInit,
                (err) => {
                    reject(err);
                });
        } else {
            const instance = facade.init(cfgAsString);
            successInit(instance);
        }
    });
}

const createConfig = (configuration: any): string => {
    // add metrics
    if (configuration !== undefined && configuration.metrics !== undefined) {
        configuration.metrics.metricsIdentity = configuration.metrics.identity;

        // quick and dirty - we need to stringify the configuration so we need to replace the metrics object (which has circular references)
        // with an object that holds only the properties needed
        const metricsConfig = {
            metricsIdentity: configuration.metrics.metricsIdentity,
            path: configuration.metrics.path,
        };
        configuration.metrics = metricsConfig;
    }

    // remove the logger - we don't need it in HC and has circular references
    delete configuration.logger;

    return JSON.stringify(configuration);
};
