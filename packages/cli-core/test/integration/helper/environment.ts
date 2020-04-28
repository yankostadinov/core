import { writeFile, existsSync, mkdir, unlink } from "fs";
import { join } from "path";
import rimraf from "rimraf";
import { USER_CONFIG_MOCK_DEFAULTS, USER_CONFIG_NAME } from "./constants";

export class TestEnvironment {

    private readonly gatewayLocation: string;
    private readonly workerLocation: string;
    private readonly userConfigLocation: string;
    
    constructor(private readonly location: string) {
        this.gatewayLocation = join(location, "gateway.js");
        this.workerLocation = join(location, "worker.js");
        this.userConfigLocation = join(location, "glue.config.json");
    }

    public async create(): Promise<void> {

        if (existsSync(this.location)) {
            console.log(`Found existing environment at: ${this.location}, removing...`);
            await this.delete();
        }

        await this.makeEnvDir();

        await Promise.all([
            this.addGateway(),
            this.addWorker(),
            this.addGlueConfig()
        ]);
    }

    public async reset(): Promise<void> {
        await this.delete();
        await this.create();
    }

    public delete(): Promise<void> {
        return new Promise((resolve, reject) => {
            rimraf(this.location, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async createDevUserConfig (data: any = USER_CONFIG_MOCK_DEFAULTS()): Promise<void> {
        const location = join(this.location, USER_CONFIG_NAME());
        const contents = JSON.stringify(data);

        await this.makeFile(location, contents);
    }

    public async deleteDevUserConfig(): Promise<void> {

        const location = join(this.location, USER_CONFIG_NAME());

        await this.removeFile(location);
    }

    private async addGateway(): Promise<void> {
        const contents = `const gateway = () => 'gateway';

        module.exports = { gateway };`;

        await this.makeFile(this.gatewayLocation, contents);
    }

    private async addWorker(): Promise<void> {
        const contents = `const worker = () => 'worker';

        module.exports = { worker };`;

        await this.makeFile(this.workerLocation, contents);
    }

    private async addGlueConfig(): Promise<void> {
        const config = {};

        await this.makeFile(this.userConfigLocation, JSON.stringify(config));
    }

    private makeEnvDir(): Promise<void> {
        return new Promise((resolve, reject) => {
            mkdir(this.location, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    private makeFile(location: string, data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            writeFile(location, data, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    private removeFile(location: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!existsSync(location)) {
                return resolve();
            }
    
            unlink(location, (err) => {
                if (err) {
                    return reject(err);
                }
    
                resolve();
            });
        });
    }
}
