import { expect } from "chai";
import "mocha";
import { ConfigController } from "../../../src/config/controller";
import { join } from "path";
import { checkIsObjValidCliConfig, generateDefaultConfig } from "../helper/config";
import { CliCommand } from "../../../src/config/cli.config";
import { TestEnvironment } from "../helper/environment";
import { after } from "mocha";
import { invalidUserConfigs } from "../helper/invalid";

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
            return testEnvironment.deleteDevUserConfig();
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

            await testEnvironment.createDevUserConfig();

            await controller.composeCliConfig(processMock);
        });

        invalidUserConfigs.forEach((invalidConfig, idx) => {
            it(`should throw when the command requires config, it was found, but it was not valid, check: ${idx + 1}`, (done) => {
                setCommand("build");
    
                testEnvironment.createDevUserConfig(invalidConfig)
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

        // should throw when no command is provided
        // should throw when an unrecognized command is provided
        // should pick up the correct config (multiple jsons and files with the expected name)
        // should resolve when no config and the command does not require config
        // should throw when the command requires config, but it was not found
        // should return a valid config, which is a correct merge between user config and defaults (diff configs)
        // all the sources defined in the returned config should be absolute paths (diff configs)
        // should not throw when all resources are present
        // should throw when one or more of the resources are not found

        // init
        // should return correct rootDirectory and commandName when no config is found
        // should return correct rootDirectory, commandName and defaults when a config is found
        // should not throw when the resources does not exist

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