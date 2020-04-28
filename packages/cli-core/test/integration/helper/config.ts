import { join } from "path";
import { CLI_CONFIG_DEFAULTS } from "../helper/constants";
import { CliConfig, CliCommand } from "../../../src/config/cli.config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkIsObjValidCliConfig = (obj: CliConfig, expect: (val: any, message?: string) => Chai.Assertion): void => {
    expect(obj).to.be.an("object");
    expect(obj.rootDirectory).to.be.a("string");
    expect(obj.command).to.be.oneOf(["serve", "build", "init", "version"]);

    if (obj.logging) {
        expect(obj.logging).to.be.oneOf(["full", "dev", "default"]);
    }

    expect(obj.glueAssets).to.be.an("object");
    expect(obj.glueAssets.worker).to.be.a("string");
    expect(obj.glueAssets.config).to.be.a("string");
    expect(obj.glueAssets.route).to.be.a("string");

    expect(obj.glueAssets.gateway).to.be.an("object");
    expect(obj.glueAssets.gateway.location).to.be.a("string");
    if (obj.glueAssets.gateway.gwLogAppender) {
        expect(obj.glueAssets.gateway.gwLogAppender).to.be.a("string");
    }

    expect(obj.server).to.be.an("object");

    expect(obj.server.apps).to.be.an("array");
    if (obj.server.apps.length) {
        obj.server.apps.forEach((app) => {
            expect(app.cookieID).to.be.a("string");
            expect(app.route).to.be.a("string");
            if (app.localhost) {
                expect(app.localhost).to.be.an("object");
                expect(app.localhost.port).to.be.a("number");
            } else {
                expect(app.file).to.be.an("object");
                expect(app.file.path).to.be.a("string");
            }
        });
    }

    expect(obj.server.settings).to.be.an("object");
    expect(obj.server.settings.port).to.be.a("number");
    if (typeof obj.server.settings.disableCache !== "undefined") {
        expect(obj.server.settings.disableCache).to.be.a("boolean");
    }

    expect(obj.server.sharedAssets).to.be.an("array");
    if (obj.server.sharedAssets.length) {
        obj.server.sharedAssets.forEach((asset) => {
            expect(asset.path).to.be.a("string");
            expect(asset.route).to.be.a("string");
        });
    }

};

export const generateDefaultConfig = (cwd: string, command: CliCommand): CliConfig => {
    const defaults = CLI_CONFIG_DEFAULTS();

    return {
        rootDirectory: cwd,
        command,
        logging: defaults.logging,
        glueAssets: {
            worker: join(cwd, defaults.glueAssets.worker),
            config: join(cwd, defaults.glueAssets.config),
            route: defaults.glueAssets.route,
            gateway: {
                location: join(cwd, defaults.glueAssets.gateway.location)
            }
        },
        server: {
            settings: {
                port: defaults.server.settings.port,
                disableCache: defaults.server.settings.disableCache
            },
            apps: defaults.server.apps,
            sharedAssets: defaults.server.sharedAssets
        }
    };
};
