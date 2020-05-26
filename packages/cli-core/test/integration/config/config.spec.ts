import { expect } from "chai";
import "mocha";
import { ConfigController } from "../../../src/config/controller";
import { join, isAbsolute } from "path";
import { checkIsObjValidCliConfig, generateDefaultConfig } from "../helper/config";
import { CliCommand, FullDevConfig } from "../../../src/config/cli.config";
import { TestEnvironment } from "../helper/environment";
import { after } from "mocha";
import { invalidUserConfigs } from "../helper/invalid";
import { validUserConfigs, validComplexMixes } from "../helper/valid";
import deepmerge from "deepmerge";
import { CLI_CONFIG_DEFAULTS } from "../helper/constants";

describe.only("ConfigController ", () => {

    let controller: ConfigController;
    let testEnvironment: TestEnvironment;


    const processMock = {
        cwd: () => join(__dirname, "../test-env/"),
        argv: ["a", "b", "init"]
    } as NodeJS.Process;

    const setCommand = (command: CliCommand): void => {
        processMock.argv[2] = command;
    };

    before(async () => {
        controller = new ConfigController();
        testEnvironment = new TestEnvironment(processMock.cwd());
        await testEnvironment.create();
    });

    after(() => testEnvironment.delete());

    describe("composeCliConfig ", () => {

        afterEach(() => {
            setCommand(undefined);
            return testEnvironment.deleteGlueDevConfig();
        });

        it("should resolve when the command does not require config and there is no config", async () => {
            setCommand("init");
            await controller.composeCliConfig(processMock);
        });

        it("should resolve with valid config object when the command does not require config and there is no config", async () => {
            setCommand("init");
            const result = await controller.composeCliConfig(processMock);
            checkIsObjValidCliConfig(result, expect);
        });

        it("should resolve with valid config object with correct defaults when the command does not require config and there is no config", async () => {
            setCommand("init");
            const result = await controller.composeCliConfig(processMock);
            const expectedConfig = generateDefaultConfig(processMock.cwd(), "init");
            expect(result).to.eql(expectedConfig);
        });

        it("should throw when the command requires config, but there is no config", (done) => {
            setCommand("build");

            controller.composeCliConfig(processMock)
                .then(() => {
                    done("Should not have resolved, because the command requires a config");
                })
                .catch(() => {
                    done();
                });
        });

        it("should resolve when the command requires config and a config was found and is valid", async () => {
            setCommand("build");

            await testEnvironment.createGlueDevConfig();

            await controller.composeCliConfig(processMock);
        });

        invalidUserConfigs.forEach((invalidConfig, idx) => {
            it(`should throw when the command requires config, it was found, but it was not valid, check: ${idx + 1}`, (done) => {
                setCommand("build");

                testEnvironment.createGlueDevConfig(invalidConfig)
                    .then(() => {
                        return controller.composeCliConfig(processMock);
                    })
                    .then(() => {
                        done(`Should not have resolved, because the config is not valid: ${JSON.stringify(invalidConfig)}`);
                    })
                    .catch(() => {
                        done();
                    });
            });
        });

        it("should throw when no command is provided", (done) => {
            setCommand(undefined);

            controller.composeCliConfig(processMock)
                .then(() => {
                    done("Should not have resolved, because no command was provided");
                })
                .catch(() => {
                    done();
                });
        });

        it("should throw when an unrecognized command is provided", (done) => {
            setCommand("notValid" as CliCommand);

            controller.composeCliConfig(processMock)
                .then(() => {
                    done("Should not have resolved, because the provided command is not recognized");
                })
                .catch(() => {
                    done();
                });
        });

        it("should resolve when no config and the command does not require config", async () => {
            setCommand("init");

            await controller.composeCliConfig(processMock);
        });

        it("should throw when the command requires config, but it was not found", (done) => {
            setCommand("serve");

            controller.composeCliConfig(processMock)
                .then(() => {
                    done("Should not have resolved, because the command requires config, but no config was found");
                })
                .catch(() => {
                    done();
                });
        });

        validUserConfigs.forEach((validConfig, idx) => {
            it(`should return a valid config, which is a correct merge between user config and defaults, check: ${idx + 1}`, async () => {
                setCommand("init");

                const expectedMerge = deepmerge(CLI_CONFIG_DEFAULTS(), validConfig) as FullDevConfig;
                expectedMerge.glueAssets.config = join(processMock.cwd(), expectedMerge.glueAssets.config);
                expectedMerge.glueAssets.worker = join(processMock.cwd(), expectedMerge.glueAssets.worker);
                expectedMerge.glueAssets.gateway.location = join(processMock.cwd(), expectedMerge.glueAssets.gateway.location);

                expectedMerge.server.apps.forEach((app) => {
                    if (app.file) {
                        app.file.path = join(processMock.cwd(), app.file.path);
                    }
                });

                expectedMerge.server.sharedAssets.forEach((asset) => {
                    asset.path = join(processMock.cwd(), asset.path);
                });

                await testEnvironment.createGlueDevConfig(validConfig);
                const cliConfig = await controller.composeCliConfig(processMock);

                expect(cliConfig.glueAssets).to.eql(expectedMerge.glueAssets);
                expect(cliConfig.command).to.eql("init");
                expect(cliConfig.logging).to.eql(expectedMerge.logging);
                expect(cliConfig.rootDirectory).to.eql(processMock.cwd());

                cliConfig?.server.apps.forEach((app, idx) => {
                    const expectedApp = expectedMerge.server.apps[idx];

                    expect(app.file).to.eql(expectedApp.file);
                    expect(app.localhost).to.eql(expectedApp.localhost);
                    expect(app.route).to.eql(expectedApp.route);
                });

            });
        });

        validComplexMixes.forEach((validConfig) => {
            it("all the sources defined in the returned config should be absolute paths", async () => {
                setCommand("init");

                await testEnvironment.createGlueDevConfig(validConfig);

                const cliConfig = await controller.composeCliConfig(processMock);

                expect(isAbsolute(cliConfig.glueAssets.config)).to.be.true;
                expect(isAbsolute(cliConfig.glueAssets.worker)).to.be.true;
                expect(isAbsolute(cliConfig.glueAssets.gateway.location)).to.be.true;

                cliConfig?.server.apps.forEach((app) => {
                    if (app.file) {
                        expect(isAbsolute(app.file.path)).to.be.true;
                    }
                });

                cliConfig?.server?.sharedAssets.forEach((asset) => {
                    expect(isAbsolute(asset.path)).to.be.true;
                });
            });
        });

        it("should not throw when all resources are present", async () => {
            setCommand("build");

            await testEnvironment.createGlueDevConfig({
                glueAssets: {
                    gateway: { location: "./gateway.js" },
                    worker: "./worker.js",
                    config: "./glue.config.json"
                }
            });

            await controller.composeCliConfig(processMock);
        });

        it("should throw when one or more of the resources are not found", (done) => {
            setCommand("build");

            testEnvironment.createGlueDevConfig({
                glueAssets: {
                    gateway: { location: "./not.real.js" },
                    worker: "./notRealWorker.js",
                    config: "./not.real.glue.config.json"
                }
            }).then(() => {
                return controller.composeCliConfig(processMock);
            }).then(() => {
                done("Should not have resolved, because the provided resources are not present.");
            }).catch(() => {
                done();
            });
        });

        describe("init", () => {

            beforeEach(() => setCommand("init"));

            afterEach(() => setCommand(undefined));

            it("should return correct rootDirectory and commandName when no config is found", () => {

            });

            it("should return correct rootDirectory, commandName and defaults when a config is found", () => {

            });

            it("should not throw when the resources does not exist", () => {

            });

        });

        // version
        // should return correct rootDirectory and commandName when no config is found
        // should return correct rootDirectory, commandName and defaults when a config is found
        // should not throw when the resources does not exist

        // build
        // should resolve with correct obj when all resources are there (diff configs)
        // should throw when no config is found
        // should throw when at least one of the resources is not found

        // serve
        // should resolve with correct obj when all resources are there (diff configs)
        // should throw when no config is found
        // should throw when at least one of the resources is not found
        // should throw when the config is valid, but no server property is found
        // should throw when the config is valid, but the server property is not
        // should throw when the config is valid and there is a server property, but no apps are defined
        // should throw when there is an invalid app definition in the server obj
        // should throw if there are two apps with the same route
    });
});