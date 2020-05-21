export const invalidGlueAssetsConfigs = [
    { glueAssets: true },
    { glueAssets: 42 },
    { glueAssets: "yes" },
    { glueAssets: ["./gateway.js"] },
    { glueAssets: { gateway: true } },
    { glueAssets: { gateway: 42 } },
    { glueAssets: { gateway: "yes" } },
    { glueAssets: { gateway: ["./gateway.js"] } },
    { glueAssets: { gateway: { location: 42 } } },
    { glueAssets: { gateway: { location: true } } },
    { glueAssets: { gateway: { location: {} } } },
    { glueAssets: { gateway: { location: ["./gateway.js"] } } },
    { glueAssets: { gateway: { gwLogAppender: 42 } } },
    { glueAssets: { gateway: { gwLogAppender: true } } },
    { glueAssets: { gateway: { gwLogAppender: {} } } },
    { glueAssets: { gateway: { gwLogAppender: ["./gateway.js"] } } },
    { glueAssets: { worker: true } },
    { glueAssets: { worker: 42 } },
    { glueAssets: { worker: { location: "./worker.js" } } },
    { glueAssets: { worker: ["./worker.js"] } },
    { glueAssets: { config: true } },
    { glueAssets: { config: 42 } },
    { glueAssets: { config: { location: "./glue.config.json" } } },
    { glueAssets: { config: ["glue.config.json"] } },
    { glueAssets: { route: true } },
    { glueAssets: { route: 42 } },
    { glueAssets: { route: { location: "./worker.js" } } },
    { glueAssets: { route: ["./worker.js"] } },
    { glueAssets: { gateway: "./gateway.js", worker: "./worker.js", config: "./glue.config.json" } }
];

export const invalidLoggingConfigs = [
    { logging: true },
    { logging: 42 },
    { logging: { location: "./worker.js" } },
    { logging: ["./worker.js"] },
    { logging: "yes" }
];

export const invalidServerConfig = [
    { server: true },
    { server: "yes" },
    { server: 42 },
    { server: [true] },
    { server: { settings: true } },
    { server: { settings: 42 } },
    { server: { settings: ["yes"] } },
    { server: { settings: "yes" } },
    { server: { settings: { port: "42" } } },
    { server: { settings: { port: true } } },
    { server: { settings: { port: [42] } } },
    { server: { settings: { port: { value: 42 } } } },
    { server: { settings: { disableCache: "true" } } },
    { server: { settings: { disableCache: 42 } } },
    { server: { settings: { disableCache: [true] } } },
    { server: { settings: { disableCache: { value: true } } } },
    { server: { apps: true } },
    { server: { apps: "yes" } },
    { server: { apps: 42 } },
    { server: { apps: { app: { route: "/", localhost: { port: 4000 } } } } },
    { server: { apps: [{ localhost: { port: 4000 } }] } },
    { server: { apps: [{ file: { path: "/" } }] } },
    { server: { apps: [{ route: "/" }] } },
    { server: { apps: [{ route: "/", localhost: { port: 4000 }, file: { path: "/" } }] } },
    { server: { apps: [{ route: 42, localhost: { port: 4000 } }] } },
    { server: { apps: [{ route: true, localhost: { port: 4000 } }] } },
    { server: { apps: [{ route: { value: "/" }, localhost: { port: 4000 } }] } },
    { server: { apps: [{ route: ["/"], localhost: { port: 4000 } }] } },
    { server: { apps: [{ route: "/", localhost: true }] } },
    { server: { apps: [{ route: "/", localhost: "4000" }] } },
    { server: { apps: [{ route: "/", localhost: 4000 }] } },
    { server: { apps: [{ route: "/", localhost: [4000] }] } },
    { server: { apps: [{ route: "/", localhost: { port: "4000" } }] } },
    { server: { apps: [{ route: "/", localhost: { port: true } }] } },
    { server: { apps: [{ route: "/", localhost: { port: [4000] } }] } },
    { server: { apps: [{ route: "/", localhost: { port: { value: 4000 } } }] } },
    { server: { apps: [{ route: "/", localhost: { port: 4000, spa: "true" } }] } },
    { server: { apps: [{ route: "/", localhost: { port: 4000, spa: 42 } }] } },
    { server: { apps: [{ route: "/", localhost: { port: 4000, spa: { value: true } } }] } },
    { server: { apps: [{ route: "/", localhost: { port: 4000, spa: [true] } }] } },
    { server: { apps: [{ route: "/", localhost: { spa: true } }] } },
    { server: { apps: [{ route: "/", localhost: {} }] } },
    { server: { apps: [{ route: "/", file: true }] } },
    { server: { apps: [{ route: "/", file: "/" }] } },
    { server: { apps: [{ route: "/", file: 4000 }] } },
    { server: { apps: [{ route: "/", file: [4000] }] } },
    { server: { apps: [{ route: "/", file: { path: 42 } }] } },
    { server: { apps: [{ route: "/", file: { path: true } }] } },
    { server: { apps: [{ route: "/", file: { path: ["/"] } }] } },
    { server: { apps: [{ route: "/", file: { path: { value: "/" } } }] } },
    { server: { apps: [{ route: "/", file: {} }] } },
    { server: { sharedAssets: true } },
    { server: { sharedAssets: "yes" } },
    { server: { sharedAssets: 42 } },
    { server: { sharedAssets: { asset: { route: "/", path: "/" } } } },
    { server: { sharedAssets: [{}] } },
    { server: { sharedAssets: [{ path: "/" }] } },
    { server: { sharedAssets: [{ route: "/" }] } },
    { server: { sharedAssets: [{ path: 42, route: "/" }] } },
    { server: { sharedAssets: [{ path: true, route: "/" }] } },
    { server: { sharedAssets: [{ path: ["/"], route: "/" }] } },
    { server: { sharedAssets: [{ path: {value: "/"}, route: "/" }] } },
    { server: { sharedAssets: [{ route: 42, path: "/" }] } },
    { server: { sharedAssets: [{ route: true, path: "/" }] } },
    { server: { sharedAssets: [{ route: ["/"], path: "/" }] } },
    { server: { sharedAssets: [{ route: {value: "/"}, path: "/" }] } },
];

export const invalidBaseConfigs: unknown[] = [
    true,
    [],
    "yes"
];

export const complexMixes = Array.from({ length: 20 }, () => {

    const getRandomEntry = <T>(arr: T[]): T => {
        const idx = Math.floor(Math.random() * (arr.length - 0)) + 0;
        return arr[idx];
    };

    const gen = {
        glueAssets: getRandomEntry(invalidGlueAssetsConfigs).glueAssets,
        server: getRandomEntry(invalidServerConfig).server,
        logging: getRandomEntry(invalidLoggingConfigs).logging
    };
    return gen;
});

export const invalidUserConfigs = [
    ...invalidGlueAssetsConfigs,
    ...invalidLoggingConfigs,
    ...invalidServerConfig,
    ...invalidBaseConfigs,
    ...complexMixes
];
