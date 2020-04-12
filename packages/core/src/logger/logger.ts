import { Glue42Core } from "../../glue";
import LogLevel from "./levels";

export class Logger {

    public static Interop: Glue42Core.Interop.API;
    public static InteropMethodName = "T42.AppLogger.Log";

    public static Instance: string;
    public static GetConnection: () => Glue42Core.Connection.API;

    private _subloggers: Logger[] = [];
    private _path: string;

    private _publishLevel: string;
    private _consoleLevel: string;
    private _metricLevel: string;

    private _name: string;
    private _metricSystem: Glue42Core.Metrics.System;
    private _parent: Logger;
    private _loggerFullName: string;
    private includeTimeAndLevel: boolean;
    private logFn: Glue42Core.CustomLogger = console;
    private customLogFn: boolean = false;

    constructor(name: string, parent?: Logger, metricSystem?: Glue42Core.Metrics.System, logFn?: Glue42Core.CustomLogger) {
        this._name = name;
        this._parent = parent;

        if (parent) {
            this._path = `${parent.path}.${name}`;
        } else {
            this._path = name;
        }

        this._loggerFullName = `[${this._path}]`;

        // create metric system
        if (typeof metricSystem !== "undefined" && metricSystem) {
            this.metricsLevel("warn", metricSystem.subSystem(name));
        }

        this.includeTimeAndLevel = !logFn;
        if (logFn) {
            this.logFn = logFn;
            this.customLogFn = true;
        }
    }

    public get name() {
        return this._name;
    }

    public get path() {
        return this._path;
    }

    public subLogger(name: string): Glue42Core.Logger.API {
        // Check if the sublogger is already created
        const existingSub = this._subloggers.filter((subLogger) => {
            return subLogger.name === name;
        })[0];

        if (existingSub !== undefined) {
            return existingSub;
        }

        // Check if the name isn't the same as one of the parent properties
        Object.keys(this).forEach((key) => {
            if (key === name) {
                throw new Error("This sub logger name is not allowed.");
            }
        });

        const sub = new Logger(name, this, undefined, this.customLogFn ? this.logFn : undefined);

        // add sublogger to subloggers array
        this._subloggers.push(sub);

        return sub;
    }

    public publishLevel(level?: string): string {
        if (level !== null && level !== undefined) {
            this._publishLevel = level;
        }

        return this._publishLevel || this._parent?.publishLevel();
    }

    public consoleLevel(level?: string): string {
        if (level !== null && level !== undefined) {
            this._consoleLevel = level;
        }

        return this._consoleLevel || this._parent?.consoleLevel();
    }

    public metricsLevel(level?: string, metricsSystem?: Glue42Core.Metrics.System): string {
        if (level !== null && level !== undefined) {
            this._metricLevel = level;
        }

        if (metricsSystem !== undefined) {
            if (typeof metricsSystem === "object" && typeof metricsSystem.objectMetric === "function") {
                this._metricSystem = metricsSystem;
            } else {
                throw new Error("Please specify metric system");
            }
        }

        return this._metricLevel || this._parent?.metricsLevel();
    }

    public log(message: string, level?: string) {
        this.publishMessage(level || LogLevel.info, message);
    }

    public trace(message: string) {
        this.log(message, LogLevel.trace);
    }

    public debug(message: string) {
        this.log(message, LogLevel.debug);
    }

    public info(message: string) {
        this.log(message, LogLevel.info);
    }

    public warn(message: string) {
        this.log(message, LogLevel.warn);
    }

    public error(message: string) {
        this.log(message, LogLevel.error);
    }

    public toAPIObject(): Glue42Core.Logger.API {
        const that = this;
        return {
            name: this.name,
            subLogger: this.subLogger.bind(that),
            publishLevel: this.publishLevel.bind(that),
            consoleLevel: this.consoleLevel.bind(that),
            metricsLevel: this.metricsLevel.bind(that),
            log: this.log.bind(that),
            trace: this.trace.bind(that),
            debug: this.debug.bind(that),
            info: this.info.bind(that),
            warn: this.warn.bind(that),
            error: this.error.bind(that),
            canPublish: this.canPublish.bind(that)
        };
    }

    public canPublish(level: string) {
        return LogLevel.canPublish(level, this.consoleLevel());
    }

    private publishMessage(level: string, message: string) {
        // Retrieve logger name and levels
        const loggerName = this._loggerFullName;

        // Add stack trace if the message is an error
        if (level === LogLevel.error) {
            const e = new Error();
            if (e.stack) {
                message = message + "\n" +
                    (e.stack.split("\n").slice(3).join("\n"));
            }
        }

        // Publish in console
        if (LogLevel.canPublish(level, this.consoleLevel())) {
            let prefix = "";
            if (this.includeTimeAndLevel) {
                const date = new Date();
                const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
                prefix = `[${time}] [${level}] `;
            }
            const toPrint = `${prefix}${loggerName}: ${message}`;
            switch (level) {
                case LogLevel.trace:
                    // tslint:disable-next-line:no-console
                    this.logFn.debug(toPrint);
                    break;
                case LogLevel.debug:
                    // tslint:disable-next-line:no-console
                    if (this.logFn.debug) {
                        // tslint:disable-next-line:no-console
                        this.logFn.debug(toPrint);
                    } else {
                        // tslint:disable-next-line:no-console
                        this.logFn.log(toPrint);
                    }
                    break;
                case LogLevel.info:
                    // tslint:disable-next-line:no-console
                    this.logFn.info(toPrint);
                    break;
                case LogLevel.warn:
                    // tslint:disable-next-line:no-console
                    this.logFn.warn(toPrint);
                    break;
                case LogLevel.error:
                    // tslint:disable-next-line:no-console
                    this.logFn.error(toPrint);
                    break;
            }
        }

        // Publish in file
        if (LogLevel.canPublish(level, this.publishLevel())) {
            const isInGd3 = Logger.GetConnection && Logger.GetConnection() && Logger.GetConnection().protocolVersion >= 3;

            if (Logger.Interop?.methods({ name: Logger.InteropMethodName }).length > 0) {
                Logger.Interop?.invoke(Logger.InteropMethodName, {
                    msg: `${message}`,
                    logger: loggerName,
                    level
                });
            }

            if (Logger.GetConnection && !isInGd3) {
                Logger.GetConnection().send("log", "LogMessage", {
                    instance: Logger.Instance,
                    level: LogLevel.order.indexOf(level),
                    logger: loggerName,
                    message,
                });
            }
        }

        // Publish in metrics
        if (LogLevel.canPublish(level, this.metricsLevel())) {
            if (this._metricSystem !== undefined) {
                this._metricSystem.objectMetric("LogMessage", {
                    Level: level,
                    Logger: loggerName,
                    Message: message,
                    Time: new Date(),
                });

                if (level === LogLevel.error) {
                    this._metricSystem.setState(100, message);
                }
            }
        }
    }
}
