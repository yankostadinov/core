/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO remove when the layouts api is ready ^
import GoldenLayout from "@glue42/golden-layout";
import { Workspace, FrameLayoutConfig, WorkspaceItem, WorkspaceLayout, AnyItem } from "./types/internal";
import storage from "./storage";
import configFactory from "./config/factory";
import configConverter from "./config/converter";
import scReader from "./config/startupReader";
import factory from "./config/factory";
import { generate } from "shortid";
import { LayoutStateResolver } from "./layout/stateResolver";

declare const window: Window & { glue: any };

export class LayoutsManager {
    private _initialWorkspaceConfig: GoldenLayout.Config;
    private readonly _layoutsType = "Workspace";
    private readonly _layoutComponentType = "Workspace";

    constructor(private readonly resolver: LayoutStateResolver) { }

    public async getInitialConfig(): Promise<FrameLayoutConfig> {
        // Preset initial config
        if (this._initialWorkspaceConfig) {
            return configFactory.generateInitialConfig([this._initialWorkspaceConfig]);
        }

        const startupConfig = scReader.config;

        // From workspace names
        if (startupConfig.workspaceNames) {
            const workspaceConfigs = await Promise.all(startupConfig.workspaceNames.map(async (name) => {
                return await this.getWorkspaceByName(name);
            }));

            const validConfigs = workspaceConfigs.filter((wc) => wc);

            if (validConfigs.length) {
                validConfigs.forEach((c) => {
                    c.id = factory.getId();
                    c.workspacesOptions = c.workspacesOptions || {};
                    if (startupConfig.context) {
                        c.workspacesOptions.context = startupConfig.context;
                    }
                });
                return configFactory.generateInitialConfig(validConfigs);
            }
        } else { // Last session
            const workspaceConfigs = this.getLastSession();
            if (workspaceConfigs && workspaceConfigs.length) {
                workspaceConfigs.forEach((wc: GoldenLayout.Config) => {
                    if (wc) {
                        wc.id = factory.getId();
                    }
                });

                return configFactory.generateInitialConfig(workspaceConfigs);
            }
        }
        // Default
        return configFactory.getDefaultFrameConfig();
    }

    public getLastSession() {
        const workspacesFrame = storage.get(storage.LAST_SESSION_KEY) || [];
        const rendererFriendlyFrameConfig = workspacesFrame.map((wc: WorkspaceItem) => {
            this.addWorkspaceIds(wc);
            this.addWindowIds(wc);
            return configConverter.convertToRendererConfig(wc);
        });
        return rendererFriendlyFrameConfig;
    }

    public async getSavedWorkspaceNames(): Promise<string[]> {
        const allLayouts = await window.glue.layouts.getAll();
        const workspaceLayouts = allLayouts.filter((l: any) => l.type === this._layoutsType);
        return workspaceLayouts.map((wl: any) => wl.name);
    }

    public async export() {
        return window.glue.layouts.export(this._layoutsType);
    }

    public async getWorkspaceByName(name: string): Promise<GoldenLayout.Config> {
        const savedWorkspaceLayout = await window.glue.layouts.get(name, this._layoutsType);
        const savedWorkspace: WorkspaceItem = savedWorkspaceLayout.components[0].state;
        const rendererFriendlyConfig = configConverter.convertToRendererConfig(savedWorkspace);

        this.addWorkspaceIds(rendererFriendlyConfig);
        this.addWindowIds(rendererFriendlyConfig);

        return rendererFriendlyConfig as GoldenLayout.Config;
    }

    public async delete(name: string) {
        await window.glue.layouts.remove(name, this._layoutsType);
    }

    public async save(name: string, workspace: Workspace): Promise<WorkspaceLayout> {
        if (!workspace.layout) {
            throw new Error("An empty layout cannot be saved");
        }
        workspace.layout.config.workspacesOptions.name = name;
        const workspaceConfig = await this.saveWorkspaceCore(workspace);
        const layoutToImport = {
            name,
            type: this._layoutsType as "Workspace",
            token: generate(),
            metadata: {},
            components: [{
                type: this._layoutComponentType as "Workspace", state: {
                    children: workspaceConfig.children,
                    config: workspaceConfig.config, context: {}
                }
            }]
        };

        await window.glue.layouts.import(layoutToImport);

        return layoutToImport;
    }

    public async saveWorkspacesFrame(workspaces: Workspace[]) {
        const configPromises = workspaces.map((w) => {
            return this.saveWorkspaceCore(w);
        });
        const configs = await Promise.all(configPromises);
        storage.set(storage.LAST_SESSION_KEY, configs);
    }

    public setInitialWorkspaceConfig(config: GoldenLayout.Config) {
        this._initialWorkspaceConfig = config;
    }

    private async saveWorkspaceCore(workspace: Workspace): Promise<WorkspaceItem> {
        if (!workspace.layout) {
            return undefined;
        }
        const workspaceConfig = this.resolver.getWorkspaceConfig(workspace.id);
        this.removeWorkspaceIds(workspaceConfig);
        await this.applyWindowLayoutState(workspaceConfig);

        const workspaceItem = configConverter.convertToAPIConfig(workspaceConfig) as WorkspaceItem;
        this.removeWorkspaceItemIds(workspaceItem);

        // The excess properties should be cleaned
        this.windowSummariesToWindowLayout(workspaceItem);
        this.addWindowUrlsToWindows(workspaceItem);

        return workspaceItem;
    }

    private windowSummariesToWindowLayout(workspaceItem: WorkspaceItem) {
        const transform = (item: AnyItem) => {
            if (item.type === "window") {
                delete item.config.isMaximized;
                delete item.config.isLoaded;
                delete item.config.isFocused;
                delete item.config.windowId;
                return;
            }

            item.children.forEach(c => transform(c));
        }

        transform(workspaceItem);
    }

    private addWindowUrlsToWindows(workspaceItem: WorkspaceItem) {
        const add = (item: AnyItem) => {
            if (item.type === "window" && !item.config.url) {
                const app = window.glue.appManager.application(item.config.appName);
                item.config.url = app?.userProperties?.details?.url;
                return;
            }

            if (item.type !== "window") {
                item.children.forEach(c => add(c));
            }
        }

        add(workspaceItem);
    }

    private addWorkspaceIds(configToPopulate: GoldenLayout.Config | GoldenLayout.ItemConfig) {
        if (!configToPopulate) {
            return;
        }
        const addRecursive = (config: GoldenLayout.ItemConfig | GoldenLayout.Config) => {
            config.id = factory.getId();

            if (config.type && config.type === "component") {
                config.componentName = `app${config.id}`;
            }

            if (config.type !== "component" && config.content) {
                config.content.forEach((i) => addRecursive(i));
            }
        };

        addRecursive(configToPopulate);
    }

    private addWindowIds(configToPopulate: GoldenLayout.Config | GoldenLayout.ItemConfig) {
        if (!configToPopulate) {
            return;
        }
        const addRecursive = (config: GoldenLayout.Config | GoldenLayout.ItemConfig | GoldenLayout.ComponentConfig) => {
            if (config.type === "component") {
                config.componentState.windowId = factory.getId();
            }

            if (config.type !== "component" && config.content) {
                config.content.forEach((i) => addRecursive(i));
            }
        };

        addRecursive(configToPopulate);
    }

    private removeWorkspaceIds(configToClean: GoldenLayout.Config) {
        const removeRecursive = (config: GoldenLayout.Config | GoldenLayout.ItemConfig) => {
            if ("id" in config) {
                delete config.id;
            }

            if (config?.type === "component") {
                config.componentName = "placeHolderId";
                config.title = "placeHolderId";
            }

            if (config.type !== "component" && config.content) {
                config.content.forEach((i) => removeRecursive(i));
            }
        };

        removeRecursive(configToClean);
    }

    private removeWorkspaceItemIds(configToClean: WorkspaceItem) {
        const removeRecursive = (config: AnyItem) => {
            if ("id" in config) {
                delete config.id;
            }

            if (config.type !== "window") {
                config.children?.forEach((i) => removeRecursive(i));
            }
        };

        removeRecursive(configToClean);
    }

    private async applyWindowLayoutState(config: GoldenLayout.Config) {
        const applyWindowLayoutStateRecursive = async (configToTraverse: GoldenLayout.ItemConfig) => {
            if (configToTraverse.type === "component") {
                const windowLayoutState = await this.getWindowLayoutState(configToTraverse.windowId);
                configToTraverse.componentState.layoutState = windowLayoutState;
            } else {
                configToTraverse.content.forEach((i) => applyWindowLayoutStateRecursive(i));
            }
        };
        await Promise.all(config.content.map(async (ic) => {
            await applyWindowLayoutStateRecursive(ic);
        }));
    }

    private async getWindowLayoutState(windowId: string) {
        // TODO to be implemented
        return Promise.resolve({ windowId });
    }
}
