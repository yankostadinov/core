import { GlueAssets, GlueDevConfig, ServerSettings, ServerApp, SharedAsset } from "../../../src/config/user.config";

export const validGlueAssetsConfigs: Array<{ glueAssets: GlueAssets }> = [
    { glueAssets: { route: "/tick" } },
    { glueAssets: { config: "./config.js" } },
    { glueAssets: { worker: "./worker.js" } },
    { glueAssets: { gateway: { location: "./gateway./js" } } },
    { glueAssets: { gateway: { gwLogAppender: "gwAppender" } } }
];

export const validLoggingConfigs: Array<{ logging: "full" | "dev" | "default" }> = [
    { logging: "full" },
    { logging: "dev" },
    { logging: "default" }
];

export const validServerConfig: Array<{ server: { settings?: ServerSettings; apps: ServerApp[]; sharedAssets?: SharedAsset[] } }> = [
    { server: { apps: [] } },
    { server: { apps: [{ route: "/app", localhost: { port: 4000, spa: true } }] } },
    { server: { apps: [{ route: "/app", localhost: { port: 9000, spa: false } }] } },
    { server: { apps: [{ route: "/app", file: { path: "./file" } }] } },
    { server: { apps: [], sharedAssets: [] } },
    { server: { apps: [], sharedAssets: [{ path: "./asset.js", route: "/asset.js" }] } },
    { server: { apps: [], settings: { port: 3000 } } },
    { server: { apps: [], settings: { port: 3000, disableCache: false } } },
];

export const validComplexMixes = Array.from({ length: 20 }, () => {

    const getRandomEntry = <T>(arr: T[]): T => {
        const idx = Math.floor(Math.random() * (arr.length - 0)) + 0;
        return arr[idx];
    };

    const gen = {
        glueAssets: getRandomEntry(validGlueAssetsConfigs).glueAssets,
        server: getRandomEntry(validServerConfig).server,
        logging: getRandomEntry(validLoggingConfigs).logging
    };
    return gen;
});

export const validUserConfigs: Array<GlueDevConfig> = [
    ...validGlueAssetsConfigs,
    ...validLoggingConfigs,
    ...validServerConfig,
    ...validComplexMixes
];
