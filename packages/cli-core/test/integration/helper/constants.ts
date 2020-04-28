import { FullDevConfig } from "../../../src/config/cli.config";
import deepMerge from "deepmerge";
import { GlueDevConfig } from "../../../src/config/user.config";

export const USER_CONFIG_NAME: () => string = () => "glue.config.dev.json";

export const USER_CONFIG_MOCK_DEFAULTS = (): GlueDevConfig => {
    return {
        glueAssets: {
            gateway: {
                location: "./gateway.js"
            },
            worker: "./worker.js",
            config: "./glue.config.json"
        }
    };
};

export const CLI_CONFIG_DEFAULTS: () => FullDevConfig = () => deepMerge<FullDevConfig>({}, {
    glueAssets: {
        gateway: {
            location: "./node_modules/@glue42/gateway-web/web/gateway-web.js"
        },
        worker: "./node_modules/@glue42/worker-web/dist/worker.js",
        config: "./glue.config.json",
        route: "/glue"
    },
    server: {
        settings: {
            port: 4242,
            disableCache: true
        },
        apps: [],
        sharedAssets: []
    },
    logging: "default"
});
