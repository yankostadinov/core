/*
 * A store for holding method back-objects registered by this instance's server
 */
import { ServerMethodInfo } from "./types";

export default class ServerRepository {

    private nextId = 0;
    private methods: ServerMethodInfo[] = [];

    public add(method: ServerMethodInfo): ServerMethodInfo {
        if (typeof method !== "object") {
            return;
        }

        if (method.repoId !== undefined) {
            return;
        }

        // id should be a string
        method.repoId = String(this.nextId);
        this.nextId += 1;

        this.methods.push(method);

        return method;
    }

    public remove(repoId: string) {
        if (typeof repoId !== "string") {
            return new TypeError("Expecting a string");
        }

        this.methods = this.methods.filter((m) => {
            return m.repoId !== repoId;
        });
    }

    public getById(id: string): ServerMethodInfo {
        if (typeof id !== "string") {
            return undefined;
        }

        return this.methods.filter((m) => {
            return m.repoId === id;
        })[0];
    }

    public getList() {
        return this.methods.map((m) => m);
    }

    public length() {
        return this.methods.length;
    }

    public reset() {
        this.methods = [];
    }
}
