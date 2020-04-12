import { Glue42Core } from "../../glue";
import { Logger } from "./logger";

export default (settings: Glue42Core.Logger.Settings, rootLoggerName: string, logFn?: Glue42Core.CustomLogger): Glue42Core.Logger.API => {

    // Convert instance to string, throw exceptions if it is not full
    const identity = settings.identity;
    if (!identity) {
        throw new Error("identity is missing");
    }

    const identityStr = `${identity.system}\\${identity.service}\\${identity.instance}`;

    Logger.Instance = identityStr;
    Logger.GetConnection = settings.getConnection;

    const mainLogger = new Logger(`${rootLoggerName}`, undefined, undefined, logFn);
    mainLogger.publishLevel(settings.publish || "off");
    mainLogger.consoleLevel(settings.console || "info");
    mainLogger.metricsLevel(settings.metrics || "off");

    const apiLogger =  mainLogger.toAPIObject();
    return apiLogger;
};
