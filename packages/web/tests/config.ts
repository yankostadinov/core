import { buildConfig } from "../src/config/config";
import { expect } from "chai";

describe("cofiguration", () => {

    it.only("passing a custom worker, without turning off extend should throw an error", async () => {
        const customWorkerPath = "../worker";
        try {
            const c = await buildConfig({ worker: customWorkerPath });
        } catch {
            return Promise.resolve();
        }
        throw new Error("should not be here");
    });
});
