import domainSession from "./gw3Domain";
import { Glue42Core } from "../../../glue";
import { default as CallbackRegistryFactory, CallbackRegistry } from "callback-registry";
import { GW3Protocol } from "../types";

export default function (connection: Glue42Core.Connection.GW3Connection, settings: Glue42Core.Connection.Settings, logger: Glue42Core.Logger.API): GW3Protocol {

    interface CreateTokenReq {
        domain?: "global";
        type: "create-token";
        peer_id?: string;
        request_id?: string;
    }

    interface CreateTokenRes {
        domain: "global";
        type: "token";
        request_id: string;
        token: string;
    }

    interface WelcomeMessage {
        peer_id: string;
        options: { info: object, access_token: string };
        resolved_identity: Glue42Core.Connection.Identity;
        available_domains: object[];
    }

    const datePrefix = "#T42_DATE#";
    const datePrefixLen = datePrefix.length;
    const dateMinLen = datePrefixLen + 1; // prefix + at least one char (1970/01/01 = 0)
    const datePrefixFirstChar = datePrefix[0];
    const registry: CallbackRegistry = CallbackRegistryFactory();
    let globalDomain: Glue42Core.Connection.GW3DomainSession;

    /* Flag indicating if the user is currently logged in */
    let isLoggedIn = false;

    /*
     * If true(default) the user wants to be connected.
     * If the user explicitly calls logout this will become false.
     * This is used to determine if it should retry trying to login.
     */
    let shouldTryLogin = true;

    /* True only if this is the initial login attempt. */
    let initialLogin = true;
    let initialLoginAttempts = 3;
    const initialLoginAttemptsInterval = 500;
    let pingTimer: any;

    const sessions: Glue42Core.Connection.GW3DomainSession[] = [];
    let loginConfig: Glue42Core.Auth;

    connection.disconnected(handleDisconnected.bind(this));

    ping();

    function processStringMessage(message: string): { msg: object, msgType: string } {
        const msg: { type: string } = JSON.parse(message, (key, value) => {

            // check for date - we have custom protocol for dates
            if (typeof value !== "string") {
                return value;
            }
            if (value.length < dateMinLen) {
                return value;
            }
            if (value[0] !== datePrefixFirstChar) {
                return value;
            }
            if (value.substring(0, datePrefixLen) !== datePrefix) {
                return value;
            }
            try {
                const milliseconds = parseInt(value.substring(datePrefixLen, value.length), 10);
                if (isNaN(milliseconds)) {
                    return value;
                }
                return new Date(milliseconds);
            } catch (ex) {
                return value;
            }
        });

        return {
            msg,
            msgType: msg.type,
        };
    }

    function createStringMessage(product: string, type: string, message: object, id?: string): string {
        const oldToJson = Date.prototype.toJSON;
        try {
            Date.prototype.toJSON = function () {
                return datePrefix + this.getTime();
            };
            const result = JSON.stringify(message);
            return result;
        } finally {
            Date.prototype.toJSON = oldToJson;
        }
    }

    function processObjectMessage(message: { type: string }): { msg: object, msgType: string } {
        if (!message.type) {
            throw new Error("Object should have type property");
        }
        return {
            msg: message,
            msgType: message.type,
        };
    }

    function createObjectMessage(product: string, type: string, message: object, id: string): object {
        return message;
    }

    async function login(config: Glue42Core.Auth, reconnect?: boolean): Promise<Glue42Core.Connection.Identity> {
        logger.debug("logging in...");
        loginConfig = config;

        if (!loginConfig) {
            // in case of no auth send empty username and password
            loginConfig = { username: "", password: "" };
        }
        shouldTryLogin = true;

        const authentication: {
            method?: string,
            token?: string,
            login?: string,
            secret?: string,
            provider?: string
        } = {};

        connection.gatewayToken = config.gatewayToken;

        if (config.gatewayToken) {
            // in case of re-connect try to refresh the GW token
            if (reconnect) {
                try {
                    const token = await this.getNewGWToken();
                    config.token = token;
                } catch (e) {
                    this.logger.warn(`failed to get GW token when reconnecting ${e?.message || e}`);
                }
            }
            authentication.method = "gateway-token";
            authentication.token = config.gatewayToken;
            connection.gatewayToken = config.gatewayToken;
        } else if (config.flowName === "sspi") {
            authentication.provider = "win";
            authentication.method = "access-token";

            authentication.token =
                (await config.flowCallback(config.sessionId, null))
                    .data
                    .toString("base64");

        } else if (config.token) {
            authentication.method = "access-token";
            authentication.token = config.token;
        } else if (config.username) {
            authentication.method = "secret";
            authentication.login = config.username;
            authentication.secret = config.password;
        } else {
            throw new Error("invalid auth message" + JSON.stringify(config));
        }

        const helloMsg: any = {
            type: "hello",
            identity: settings.identity,
            authentication
        };

        if (config.sessionId) {
            helloMsg.request_id = config.sessionId;
        }

        globalDomain = domainSession(
            "global",
            connection,
            logger,
            [
                "welcome",
                "token",
                "authentication-request"
            ]);

        const sendOptions: Glue42Core.Connection.SendMessageOptions = { skipPeerId: true };
        if (initialLogin) {
            sendOptions.retryInterval = settings.reconnectInterval;
            sendOptions.maxRetries = settings.reconnectAttempts;
        }

        try {
            let welcomeMsg: WelcomeMessage;

            while (true) {
                const msg: any = await globalDomain.send(helloMsg, undefined, sendOptions);
                if (msg.type === "authentication-request") {
                    // respond to auth challenge
                    const token = Buffer.from(msg.authentication.token, "base64");

                    helloMsg.authentication.token =
                        (await config.flowCallback(config.sessionId, token))
                            .data
                            .toString("base64");

                    helloMsg.request_id = config.sessionId;
                    continue;
                } else if (msg.type === "welcome") {
                    // we're in
                    welcomeMsg = msg as WelcomeMessage;
                    break;
                } else if (msg.type === "error") {
                    throw new Error("Authentication failed: " + msg.reason);
                } else {
                    throw new Error("Unexpected message type during authentication: " + msg.type);
                }
            }
            // we've logged in once - set this to false for the rest of the lifetime
            initialLogin = false;
            logger.debug("login successful with PeerId " + welcomeMsg.peer_id);

            connection.peerId = welcomeMsg.peer_id;
            connection.resolvedIdentity = welcomeMsg.resolved_identity;
            connection.availableDomains = welcomeMsg.available_domains;
            if (welcomeMsg.options) {
                connection.token = welcomeMsg.options.access_token;
                connection.info = welcomeMsg.options.info;
            }
            setLoggedIn(true);
            return welcomeMsg.resolved_identity;
        } catch (err) {
            logger.error("error sending hello message - " + (err.message || err.msg || err.reason || err));
            throw err;
        } finally {
            if (config && config.flowCallback && config.sessionId) {
                config.flowCallback(config.sessionId, null);
            }
        }
    }

    function logout() {
        logger.debug("logging out...");
        shouldTryLogin = false;

        if (pingTimer) {
            clearTimeout(pingTimer);
        }

        // go through all sessions and leave the corresponding domain
        sessions.forEach((session) => {
            session.leave();
        });
    }

    function loggedIn(callback: (() => void)): () => void {
        if (isLoggedIn) {
            callback();
        }
        return registry.add("onLoggedIn", callback);
    }

    function domain(domainName: string, domainLogger: Glue42Core.Logger.API, successMessages?: string[], errorMessages?: string[]): Glue42Core.Connection.GW3DomainSession {
        let session = sessions.filter((s) => s.domain === domainName)[0];
        if (!session) {
            session = domainSession(domainName, connection, domainLogger, successMessages, errorMessages);
            sessions.push(session);
        }
        return session;
    }

    function handleDisconnected() {
        setLoggedIn(false);
        const tryToLogin = shouldTryLogin;
        if (tryToLogin && initialLogin) {
            if (initialLoginAttempts <= 0) {
                return;
            }
            initialLoginAttempts--;
        }

        logger.debug("disconnected - will try new login?" + shouldTryLogin);
        if (shouldTryLogin) {
            if (!loginConfig) {
                throw new Error("no login info");
            }

            connection.login(loginConfig, true)
                .catch(() => {
                    setTimeout(handleDisconnected, 1000);
                });
        }
    }

    function setLoggedIn(value: boolean) {
        isLoggedIn = value;
        if (isLoggedIn) {
            registry.execute("onLoggedIn");
        }
    }

    function ping() {
        // if we don't want to be connected return
        if (!shouldTryLogin) {
            return;
        }

        // if logged in ping
        if (isLoggedIn) {
            connection.send("", "", { type: "ping" });
        }

        // schedule next after 30 sec
        pingTimer = setTimeout(ping, 30 * 1000);
    }

    function authToken(): Promise<string> {
        const createTokenReq: CreateTokenReq = {
            type: "create-token"
        };

        if (!this.globalDomain) {
            return Promise.reject(new Error("no global domain session"));
        }

        return globalDomain.send(createTokenReq)
            .then((res: CreateTokenRes) => {
                return res.token;
            });
    }

    return {
        processStringMessage,
        createStringMessage,
        createObjectMessage,
        processObjectMessage,

        login,
        logout,
        loggedIn,
        domain,
        authToken,
        get isLoggedIn() {
            return isLoggedIn;
        }
    };
}
