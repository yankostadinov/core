import { LocalStore } from "./stores/local";
import { RemoteStore } from "./types";
import { Glue42Web } from "../../web";
import { AutoStorage } from "./stores/auto";

export class LayoutStorage {
    constructor(
        private readonly localStore: LocalStore,
        private readonly autoStore: AutoStorage,
        private readonly remoteStore?: RemoteStore) { }

    public async get(name: string, layoutType: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout | undefined> {

        const foundRemote = await this.remoteStore?.get(name, layoutType);

        const foundLocal = await this.localStore.get(name, layoutType);

        if (foundRemote && foundLocal) {
            return foundRemote;
        }

        return foundRemote || foundLocal;
    }

    public async getAll(layoutType: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout[]> {

        const [local, remote] = await Promise.all([
            this.localStore.getAll(layoutType),
            new Promise<Glue42Web.Layouts.Layout[]>((resolve) => {
                if (this.remoteStore) {
                    return this.remoteStore.getAll(layoutType).then(resolve);
                }
                resolve([]);
            })
        ]);

        // discarding all local layouts which are in conflict with a remote layout, because the remotes have priority
        const nonConflictLocal = local.filter((localLayout) => !remote.some((remoteLayout) => remoteLayout.name === localLayout.name));

        return remote.concat(nonConflictLocal);
    }

    public async store(layout: Glue42Web.Layouts.Layout, layoutType: Glue42Web.Layouts.LayoutType): Promise<void> {

        if (layout.metadata.allowSave) {
            await this.localStore.store(layout, layoutType);
            return;
        }

        const remoteLayout = await this.remoteStore?.get(layout.name, layoutType);

        if (remoteLayout) {
            return;
        }

        layout.metadata.allowSave = true;
        await this.localStore.store(layout, layoutType);
    }

    public async remove(name: string, layoutType: Glue42Web.Layouts.LayoutType): Promise<void> {
        await this.localStore.delete(name, layoutType);
    }

    public getAutoLayout(name: string): Glue42Web.Layouts.Layout | undefined {
        return this.autoStore.get(name, "Global");
    }

    public storeAutoLayout(layout: Glue42Web.Layouts.Layout): void {
        this.autoStore.save(layout);
    }
}
