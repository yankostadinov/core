import metrics from "./metrics/main";
import gatewayConnection from "./connection/main";
import logger from "./logger/main";
import agm from "./interop/main";
import bus from "./bus/main";
import { Glue42Core } from "../glue";
import prepareConfig from "./config";
import nullConnection from "./nullConnection";
import timer from "./utils/timer";
import Utils from "./utils/utils";
import { Timer } from "./types";
import { ContextsModule } from "./contexts/main";
import { ContextMessageReplaySpec } from "./contexts/contextMessageReplaySpec";
import { Logger } from "./logger/logger";
import { version } from "../package.json";

const GlueCore = (userConfig?: Glue42Core.Config, ext?: Glue42Core.Extension): Promise<Glue42Core.GlueCore> => {
    let gdVersion: number = -1;
    let hc: Glue42Core.HtmlContainerObject;
    let glue42gd: Glue42Core.GDObject;
    let preloadPromise: Promise<any> = Promise.resolve();

    if (typeof window !== "undefined") {
        gdVersion = Utils.getGDMajorVersion();
        if (gdVersion === 2) {
            hc = window.htmlContainer;
        } else if (gdVersion >= 3) {
            glue42gd = window.glue42gd;
            preloadPromise = window.gdPreloadPromise || preloadPromise;
        }
    }

    const glueInitTimer = timer();

    userConfig = userConfig || {};
    ext = ext || {};
    const internalConfig = prepareConfig(userConfig, ext, hc, glue42gd, gdVersion);

    // Init the GLUE namespace
    let _connection: Glue42Core.Connection.API;
    let _interop: Glue42Core.Interop.API;
    let _logger: Glue42Core.Logger.API;
    let _rootMetrics: Glue42Core.Metrics.System;
    let _metrics: Glue42Core.Metrics.API;
    let _contexts: Glue42Core.Contexts.API;
    let _bus: Glue42Core.Bus.API;

    const libs: { [key: string]: Glue42Core.GlueInnerLib } = {};

    function registerLib(name: string | string[], inner: Glue42Core.GlueInnerLib, t: Timer) {

        inner.initStartTime = t.startTime;
        if (inner.ready) {
            inner.ready().then(() => {
                inner.initTime = t.stop();
                inner.initEndTime = t.endTime;
            });
        } else {
            inner.initTime = t.stop();
            inner.initEndTime = t.endTime;
        }

        if (!Array.isArray(name)) {
            name = [name];
        }

        name.forEach((n) => {
            libs[n] = inner;
            (GlueCore as any)[n] = inner;
        });
    }

    function setupConnection(): Promise<object> {
        const initTimer = timer();
        internalConfig.connection.logger = _logger.subLogger("connection");
        _connection = gatewayConnection(internalConfig.connection);

        let authPromise: Promise<any> = Promise.resolve(internalConfig.auth);

        // no auth - what we do in different protocol versions
        if (internalConfig.connection && !internalConfig.auth) {
            const protocolVersion = internalConfig.connection.protocolVersion;

            // v1 or no protocol version - we don't need auth in that case
            if (!protocolVersion || protocolVersion === 1) {
                registerLib("connection", _connection, initTimer);
                return Promise.resolve({});
            }
            // v2 requires auth
            if (protocolVersion === 2) {
                return Promise.reject("You need to provide auth information");
            }
            // v3 if running in gd pull off gw token. If not in gd reject
            if (protocolVersion === 3) {
                if (glue42gd) {
                    authPromise = glue42gd.getGWToken().then((token) => {
                        return {
                            gatewayToken: token
                        };
                    });
                } else {
                    // assign to auth promise so we ca cleanup the connection
                    authPromise = Promise.reject("You need to provide auth information");
                }
            }
        }

        return authPromise
            .then((authConfig) => {
                // convert the authConfig to AuthRequest object
                let authRequest: Glue42Core.Auth;
                if (typeof authConfig === "string" || typeof authConfig === "number") {
                    authRequest = {
                        token: authConfig as string
                    };
                } else if (Object.prototype.toString.call(authConfig) === "[object Object]") {
                    authRequest = authConfig;
                } else {
                    throw new Error("Invalid auth object - " + JSON.stringify(authConfig));
                }
                return authRequest;
            })
            .then((authRequest: Glue42Core.Auth) => {
                // do the login
                return _connection.login(authRequest);
            })
            .then((identity) => {
                if (identity) {
                    if (identity.machine) {
                        internalConfig.agm.instance.machine = identity.machine;
                    }
                    if (identity.user) {
                        internalConfig.agm.instance.user = identity.user;
                    }
                }
                registerLib("connection", _connection, initTimer);
                return internalConfig;
            })
            .catch((e) => {
                if (_connection) {
                    _connection.logout();
                }
                throw e;
            });
    }

    function setupLogger(): Promise<void> {
        // Logger
        const initTimer = timer();
        const loggerConfig: Glue42Core.Logger.Settings = {
            identity: internalConfig.identity,
            getConnection: (): Glue42Core.Connection.API => {
                return _connection || nullConnection;
            },
            publish: internalConfig.logger.publish || "off",
            console: internalConfig.logger.console || "error",
            metrics: (internalConfig.metrics && internalConfig.logger.metrics) || "off"
        };
        const rootLoggerName = internalConfig?.connection?.identity?.application ?? internalConfig?.agm?.instance?.application;
        _logger = logger(loggerConfig, rootLoggerName, internalConfig.customLogger);

        registerLib("logger", _logger, initTimer);

        return Promise.resolve(undefined);
    }

    function setupMetrics(): Promise<void> {
        if (internalConfig.metrics) {
            const initTimer = timer();

            _rootMetrics = metrics({
                identity: internalConfig.metrics.identity,
                connection: internalConfig.metrics ? _connection : nullConnection,
                logger: _logger.subLogger("metrics")
            });

            if (internalConfig.metrics.disableAutoAppSystem) {
                _metrics = _rootMetrics as Glue42Core.Metrics.API;
            } else {
                _metrics = _rootMetrics.subSystem("App") as Glue42Core.Metrics.API;
            }

            // Creating subsystem for reporting and feature metric
            const reportingSystem: Glue42Core.Metrics.System = _metrics.subSystem("reporting");
            const def = {
                name: "features",
                conflation: Glue42Core.Metrics.ConflationMode.TickByTick,
            };

            let _featureMetric: Glue42Core.Metrics.ObjectMetric;

            _metrics.featureMetric = (name: string, action: string, payload: string) => {
                if (typeof name === "undefined" || name === "") {
                    throw new Error("name is mandatory");
                } else if (typeof action === "undefined" || action === "") {
                    throw new Error("action is mandatory");
                } else if (typeof payload === "undefined" || payload === "") {
                    throw new Error("payload is mandatory");
                }

                if (!_featureMetric) {
                    _featureMetric = reportingSystem.objectMetric(def, { name, action, payload });
                } else {
                    _featureMetric.update({
                        name,
                        action,
                        payload
                    });
                }
            };

            const logEventsParent = _metrics.parent || _metrics;
            const logEvents = logEventsParent.subSystem("LogEvents");
            _logger.metricsLevel("warn", logEvents);

            registerLib("metrics", _metrics, initTimer);
        }
        return Promise.resolve(undefined);
    }

    function setupAGM(): Promise<object> {
        const initTimer = timer();

        // AGM
        const agmConfig: Glue42Core.Interop.Settings = {
            instance: internalConfig.agm.instance,
            connection: _connection,
            logger: _logger.subLogger("interop"),
            forceGW: internalConfig.connection && internalConfig.connection.force,
            gdVersion,
        };

        return new Promise((resolve, reject) => {
            agm(agmConfig)
                .then((agmLib: any) => {
                    _interop = agmLib;
                    Logger.Interop = _interop;
                    registerLib(["interop", "agm"], _interop, initTimer);
                    resolve(internalConfig);
                })
                .catch((err: string) => {
                    return reject(err);
                });
        });
    }

    function setupContexts() {
        const hasActivities = (internalConfig.activities && _connection.protocolVersion === 3);
        const needsContexts = internalConfig.contexts || hasActivities;
        if (needsContexts) {
            const initTimer = timer();

            _contexts = new ContextsModule({
                connection: _connection,
                logger: _logger.subLogger("contexts"),
                gdMajorVersion: gdVersion
            });
            registerLib("contexts", _contexts, initTimer);
            return _contexts;

            // NB: The shared contexts data is part of the global domain,
            // which is joined implicitly and there is no 'Success' message
            // to indicate that the initial state has arrived.
            // We're relying on the fact that none of the other Glue libs
            // rely on the shared contexts' state, and that the 'contexts'
            // lib is created first so any other domain's success message
            // will arrive after our state, so the contexts will be visible
            // when the Glue promise resolves.
        } else {
            const replayer = (_connection as Glue42Core.Connection.GW3Connection).replayer;
            if (replayer) {
                replayer.drain(ContextMessageReplaySpec.name, null);
            }
        }
    }

    function setupExternalLibs(externalLibs: Glue42Core.ExternalLib[]): Promise<any> {
        try {
            externalLibs.forEach((lib) => {
                setupExternalLib(lib.name, lib.create);
            });

            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    function setupExternalLib(name: string, createCallback: (libs: object) => Glue42Core.GlueInnerLib) {
        const initTimer = timer();
        const lib = createCallback(libs);
        if (lib) {
            registerLib(name, lib, initTimer);
        }
    }

    function waitForLibs(): Promise<object[]> {
        // get all libs that have ready promises and wait for these to be ready
        const libsReadyPromises = Object.keys(libs).map((key) => {
            const lib = libs[key];
            return lib.ready ?
                lib.ready() : Promise.resolve();
        });

        return Promise.all(libsReadyPromises);
    }

    function constructGlueObject(): Glue42Core.GlueCore {

        const feedbackFunc = (feedbackInfo?: Glue42Core.FeedbackInfo) => {
            if (!_interop) {
                return;
            }
            _interop.invoke("T42.ACS.Feedback", feedbackInfo, "best");
        };

        const info: { [key: string]: any } = {
            coreVersion: version,
            version: internalConfig.version
        };

        glueInitTimer.stop();

        const glue: Glue42Core.GlueCore & ({ [key: string]: any }) = {
            interop: _interop,
            agm: _interop,
            metrics: _metrics,
            connection: _connection,
            bus: _bus,
            logger: _logger,
            contexts: _contexts,
            feedback: feedbackFunc,
            info,
            version: internalConfig.version,
            userConfig,
            done: () => {
                _connection.logout();
                return Promise.resolve();
            }
        };

        // ver performance
        glue.performance = {
            get glueVer() {
                return internalConfig.version;
            },
            get glueConfig() {
                return JSON.stringify(userConfig);
            },
            get browser() {
                return window.performance.timing.toJSON();
            },
            get memory() {
                return (window as any).performance.memory;
            },
            get initTimes() {
                const result = Object.keys(glue)
                    .filter((key) => {
                        if (key === "initTimes" || key === "agm") {
                            return false;
                        }
                        return glue[key]?.initTime;
                    })
                    .map((key) => {
                        return {
                            name: key,
                            time: glue[key].initTime,
                            startTime: glue[key].initStartTime,
                            endTime: glue[key].initEndTime
                        };
                    });
                // add glue
                result.push({
                    name: "glue",
                    startTime: glueInitTimer.startTime,
                    endTime: glueInitTimer.endTime,
                    time: glueInitTimer.period
                });

                return result;
            }
        };

        // attach each lib to glue && attach versions to info object
        Object.keys(libs).forEach((key) => {
            const lib = libs[key];
            glue[key] = lib;
        });

        // construct the config object to be exposed to end user
        // transfer config keys from internalConfig and then ext
        glue.config = {};

        Object.keys(internalConfig).forEach((k) => {
            glue.config[k] = internalConfig[k];
        });

        if (ext.extOptions) {
            Object.keys(ext.extOptions).forEach((k) => {
                glue.config[k] = ext.extOptions[k];
            });
        }

        if (ext.enrichGlue) {
            ext.enrichGlue(glue);
        }

        // push perf data to hc if needed
        if (hc && hc.perfDataNeeded && hc.updatePerfData) {
            const delay = hc.perfDataDelay || 100;

            setTimeout(() => {
                hc.updatePerfData(glue.performance);
            }, delay);
        }

        if (glue42gd && glue42gd.updatePerfData) {
            glue42gd.updatePerfData(glue.performance);
        }

        return glue;
    }

    function setupBus(): Promise<object> {
        if (!internalConfig.bus) {
            return Promise.resolve(undefined);
        }

        const initTimer = timer();

        const busSettings: Glue42Core.Bus.Settings = {
            connection: _connection,
            logger: _logger.subLogger("bus")
        };

        return new Promise((resolve, reject) => {
            bus(busSettings)
                .then((busLib: any) => {
                    _bus = busLib;
                    registerLib("bus", _bus, initTimer);
                    resolve();
                })
                .catch((err: string) => {
                    return reject(err);
                });
        });
    }

    return preloadPromise
        .then(setupLogger)
        .then(setupConnection)
        .then(() => Promise.all([setupMetrics(), setupAGM(), setupContexts(), setupBus()]))
        .then(() => {
            return setupExternalLibs(internalConfig.libs || []);
        })
        .then(waitForLibs)
        .then(constructGlueObject)
        .catch((err) => {
            // if there is some some error include the libs object for debugging purposes
            return Promise.reject({
                err,
                libs
            });
        });
};

export default GlueCore;
