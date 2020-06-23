import { LocalStore } from "./stores/local";
import { RemoteStore } from "./types";
import { Glue42Web } from "../../web";

export class LayoutStorage {
    constructor(private readonly localStore: LocalStore, private readonly remoteStore?: RemoteStore) { }

    public async getAutoLayout(): Promise<Glue42Web.Layouts.Layout | undefined> {
        return await this.localStore.getAutoLayout();
    }

    public async get(name: string, layoutType: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout | undefined> {
        // todo: if name conflict is found -> print error and return the remote
        const foundRemote = await this.remoteStore?.get(name, layoutType);
        
        const foundLocal = await this.localStore.get(name, layoutType);

        if (foundRemote && foundLocal) {
            console.warn(`Found conflicting layout names for layout: ${foundLocal?.name}, resolving with remote layout`);

            return foundRemote;
        }

        return foundRemote || foundLocal;
    }

    public async getAll(layoutType: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout[]> {
        // todo: if name conflict is found -> print error and return the remote
        const [local, remote] = await Promise.all([
            this.localStore.getAll(layoutType),
            new Promise<Glue42Web.Layouts.Layout[]>((resolve) => {
                if (this.remoteStore) {
                    return this.remoteStore.getAll(layoutType).then(resolve);
                }
                resolve([]);
            })
        ]);

        return local.concat(remote);
    }

    public async store(layout: Glue42Web.Layouts.Layout, layoutType: Glue42Web.Layouts.LayoutType, isAuto = false): Promise<void> {
        // todo: should not store if the name of the layout matches the name of a remote layout
        if (isAuto) {
            await this.localStore.storeAutoLayout(layout);
            return;
        }
        await this.localStore.store(layout, layoutType);
    }

    public async remove(name: string, layoutType: Glue42Web.Layouts.LayoutType): Promise<void> {
        await this.localStore.delete(name, layoutType);
    }
}
