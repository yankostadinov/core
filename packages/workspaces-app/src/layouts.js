"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutsManager = void 0;
const storage_1 = require("./storage");
const factory_1 = require("./config/factory");
const converter_1 = require("./config/converter");
const startupReader_1 = require("./config/startupReader");
const factory_2 = require("./config/factory");
const shortid_1 = require("shortid");
class LayoutsManager {
    constructor(resolver) {
        this.resolver = resolver;
        this._layoutsType = "Workspace";
        this._layoutComponentType = "Workspace";
    }
    async getInitialConfig() {
        // Preset initial config
        if (this._initialWorkspaceConfig) {
            return factory_1.default.generateInitialConfig([this._initialWorkspaceConfig]);
        }
        const startupConfig = startupReader_1.default.config;
        // From workspace names
        if (startupConfig.workspaceNames) {
            const workspaceConfigs = await Promise.all(startupConfig.workspaceNames.map(async (name) => {
                return await this.getWorkspaceByName(name);
            }));
            const validConfigs = workspaceConfigs.filter((wc) => wc);
            if (validConfigs.length) {
                validConfigs.forEach((c) => {
                    c.id = factory_2.default.getId();
                    c.workspacesOptions = c.workspacesOptions || {};
                    if (startupConfig.context) {
                        c.workspacesOptions.context = startupConfig.context;
                    }
                });
                return factory_1.default.generateInitialConfig(validConfigs);
            }
        }
        else { // Last session
            const workspaceConfigs = this.getLastSession();
            if (workspaceConfigs && workspaceConfigs.length) {
                workspaceConfigs.forEach((wc) => {
                    if (wc) {
                        wc.id = factory_2.default.getId();
                    }
                });
                return factory_1.default.generateInitialConfig(workspaceConfigs);
            }
        }
        // Default
        return factory_1.default.getDefaultFrameConfig();
    }
    getLastSession() {
        const workspacesFrame = storage_1.default.get(storage_1.default.LAST_SESSION_KEY) || [];
        const rendererFriendlyFrameConfig = workspacesFrame.map((wc) => {
            this.addWorkspaceIds(wc);
            this.addWindowIds(wc);
            return converter_1.default.convertToRendererConfig(wc);
        });
        return rendererFriendlyFrameConfig;
    }
    async getSavedWorkspaceNames() {
        const allLayouts = await window.glue.layouts.getAll(this._layoutsType);
        const workspaceLayouts = allLayouts.filter((l) => l.type === this._layoutsType);
        return workspaceLayouts.map((wl) => wl.name);
    }
    async export() {
        return window.glue.layouts.export(this._layoutsType);
    }
    async getWorkspaceByName(name) {
        const savedWorkspaceLayout = await window.glue.layouts.get(name, this._layoutsType);
        const savedWorkspace = savedWorkspaceLayout.components[0].state;
        const rendererFriendlyConfig = converter_1.default.convertToRendererConfig(savedWorkspace);
        this.addWorkspaceIds(rendererFriendlyConfig);
        this.addWindowIds(rendererFriendlyConfig);
        return rendererFriendlyConfig;
    }
    async delete(name) {
        await window.glue.layouts.remove(this._layoutsType, name);
    }
    async save(name, workspace) {
        if (!workspace.layout) {
            throw new Error("An empty layout cannot be saved");
        }
        workspace.layout.config.workspacesOptions.name = name;
        const workspaceConfig = await this.saveWorkspaceCore(workspace);
        const layoutToImport = {
            name,
            type: this._layoutsType,
            token: shortid_1.generate(),
            metadata: {},
            components: [{
                    type: this._layoutComponentType,
                    state: {
                        children: workspaceConfig.children,
                        config: workspaceConfig.config, context: {}
                    }
                }]
        };
        await window.glue.layouts.import([layoutToImport]);
        return layoutToImport;
    }
    async saveWorkspacesFrame(workspaces) {
        const configPromises = workspaces.map((w) => {
            return this.saveWorkspaceCore(w);
        });
        const configs = await Promise.all(configPromises);
        storage_1.default.set(storage_1.default.LAST_SESSION_KEY, configs);
    }
    setInitialWorkspaceConfig(config) {
        this._initialWorkspaceConfig = config;
    }
    async saveWorkspaceCore(workspace) {
        if (!workspace.layout) {
            return undefined;
        }
        const workspaceConfig = this.resolver.getWorkspaceConfig(workspace.id);
        this.removeWorkspaceIds(workspaceConfig);
        await this.applyWindowLayoutState(workspaceConfig);
        const workspaceItem = converter_1.default.convertToAPIConfig(workspaceConfig);
        this.removeWorkspaceItemIds(workspaceItem);
        // The excess properties should be cleaned
        this.windowSummariesToWindowLayout(workspaceItem);
        this.addWindowUrlsToWindows(workspaceItem);
        return workspaceItem;
    }
    windowSummariesToWindowLayout(workspaceItem) {
        const transform = (item) => {
            if (item.type === "window") {
                delete item.config.isMaximized;
                delete item.config.isLoaded;
                delete item.config.isFocused;
                delete item.config.windowId;
                return;
            }
            item.children.forEach(c => transform(c));
        };
        transform(workspaceItem);
    }
    addWindowUrlsToWindows(workspaceItem) {
        const add = (item) => {
            var _a, _b;
            if (item.type === "window" && !item.config.url) {
                const app = window.glue.appManager.application(item.config.appName);
                item.config.url = (_b = (_a = app === null || app === void 0 ? void 0 : app.userProperties) === null || _a === void 0 ? void 0 : _a.details) === null || _b === void 0 ? void 0 : _b.url;
                return;
            }
            if (item.type !== "window") {
                item.children.forEach(c => add(c));
            }
        };
        add(workspaceItem);
    }
    addWorkspaceIds(configToPopulate) {
        if (!configToPopulate) {
            return;
        }
        const addRecursive = (config) => {
            config.id = factory_2.default.getId();
            if (config.type && config.type === "component") {
                config.componentName = `app${config.id}`;
            }
            if (config.type !== "component" && config.content) {
                config.content.forEach((i) => addRecursive(i));
            }
        };
        addRecursive(configToPopulate);
    }
    addWindowIds(configToPopulate) {
        if (!configToPopulate) {
            return;
        }
        const addRecursive = (config) => {
            if (config.type === "component") {
                config.componentState.windowId = factory_2.default.getId();
            }
            if (config.type !== "component" && config.content) {
                config.content.forEach((i) => addRecursive(i));
            }
        };
        addRecursive(configToPopulate);
    }
    removeWorkspaceIds(configToClean) {
        const removeRecursive = (config) => {
            if ("id" in config) {
                delete config.id;
            }
            if ((config === null || config === void 0 ? void 0 : config.type) === "component") {
                config.componentName = "placeHolderId";
                config.title = "placeHolderId";
            }
            if (config.type !== "component" && config.content) {
                config.content.forEach((i) => removeRecursive(i));
            }
        };
        removeRecursive(configToClean);
    }
    removeWorkspaceItemIds(configToClean) {
        const removeRecursive = (config) => {
            var _a;
            if ("id" in config) {
                delete config.id;
            }
            if (config.type !== "window") {
                (_a = config.children) === null || _a === void 0 ? void 0 : _a.forEach((i) => removeRecursive(i));
            }
        };
        removeRecursive(configToClean);
    }
    async applyWindowLayoutState(config) {
        const applyWindowLayoutStateRecursive = async (configToTraverse) => {
            if (configToTraverse.type === "component") {
                const windowLayoutState = await this.getWindowLayoutState(configToTraverse.windowId);
                configToTraverse.componentState.layoutState = windowLayoutState;
            }
            else {
                configToTraverse.content.forEach((i) => applyWindowLayoutStateRecursive(i));
            }
        };
        await Promise.all(config.content.map(async (ic) => {
            await applyWindowLayoutStateRecursive(ic);
        }));
    }
    async getWindowLayoutState(windowId) {
        // TODO to be implemented
        return Promise.resolve({ windowId });
    }
}
exports.LayoutsManager = LayoutsManager;
//# sourceMappingURL=layouts.js.map