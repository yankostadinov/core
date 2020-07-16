import { checkThrowCallback, nonEmptyStringDecoder, restoreWorkspaceConfigDecoder, workspaceDefinitionDecoder, workspaceBuilderCreateConfigDecoder, resizeConfigDecoder, moveConfigDecoder } from "../shared/decoders";
import { SubscriptionConfig } from "../types/subscription";
import { PrivateDataManager } from "../shared/privateDataManager";
import { FrameStreamData, WorkspaceStreamData, WindowStreamData, ContainerStreamData } from "../types/protocol";
import {Frame as FrameAPI, ResizeConfig, MoveConfig, FrameSnapshot, RestoreWorkspaceConfig, Workspace, WorkspaceDefinition, WorkspaceCreateConfig, Unsubscribe, WorkspaceWindow, Row, Column, Group} from "../../workspaces.d";
import { FramePrivateData } from "../types/privateData";

interface PrivateData {
    manager: PrivateDataManager;
}

const data = new WeakMap<Frame, PrivateData>();

const getData = (model: Frame): FramePrivateData => {
    return data.get(model).manager.getFrameData(model);
};

const getDataManager = (model: Frame): PrivateDataManager => {
    return data.get(model).manager;
};

export class Frame implements FrameAPI {

    constructor(dataManager: PrivateDataManager) {
        data.set(this, { manager: dataManager });
    }

    public get id(): string {
        return getData(this).summary.id;
    }

    public resize(config: ResizeConfig): Promise<void> {
        const validatedConfig = resizeConfigDecoder.runWithException(config);
        const myId = getData(this).summary.id;

        return getData(this).controller.resizeItem(myId, validatedConfig);
    }

    public move(config: MoveConfig): Promise<void> {
        const validatedConfig = moveConfigDecoder.runWithException(config);

        const myId = getData(this).summary.id;
        return getData(this).controller.moveFrame(myId, validatedConfig);
    }

    public focus(): Promise<void> {
        const myId = getData(this).summary.id;
        return getData(this).controller.focusItem(myId);
    }

    public close(): Promise<void> {
        const myId = getData(this).summary.id;
        return getData(this).controller.closeItem(myId);
    }

    public snapshot(): Promise<FrameSnapshot> {
        const myId = getData(this).summary.id;
        return getData(this).controller.getSnapshot(myId, "frame");
    }

    public async workspaces(): Promise<Workspace[]> {
        const controller = getData(this).controller;
        return controller.getWorkspaces((wsp) => wsp.frameId === this.id);
    }

    public async restoreWorkspace(name: string, options?: RestoreWorkspaceConfig): Promise<Workspace> {
        nonEmptyStringDecoder.runWithException(name);
        const validatedOptions = restoreWorkspaceConfigDecoder.runWithException(options);

        return getData(this).controller.restoreWorkspace(name, validatedOptions);
    }

    public createWorkspace(definition: WorkspaceDefinition, config?: WorkspaceCreateConfig): Promise<Workspace> {
        const validatedDefinition = workspaceDefinitionDecoder.runWithException(definition);
        const validatedConfig = workspaceBuilderCreateConfigDecoder.runWithException(config);

        return getData(this).controller.createWorkspace(validatedDefinition, validatedConfig);
    }

    public async onClosing(callback: (frame: Frame) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = (payload: FrameStreamData): void => {
            getDataManager(this).remapFrame(this, payload.frameSummary);
            callback(this);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "closing",
            streamType: "frame",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onClosed(callback: (closed: { frameId: string }) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = (payload: FrameStreamData): void => {
            callback({ frameId: payload.frameSummary.id });
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "closed",
            streamType: "frame",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onFocusChange(callback: (frame: Frame) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = (payload: FrameStreamData): void => {
            getDataManager(this).remapFrame(this, payload.frameSummary);
            callback(this);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "focus",
            streamType: "frame",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onWorkspaceOpened(callback: (workspace: Workspace) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = async (payload: WorkspaceStreamData): Promise<void> => {
            const workspace = await getData(this).controller.getWorkspace((wsp) => wsp.id === payload.workspaceSummary.id);
            callback(workspace);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "added",
            streamType: "workspace",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onWorkspaceFocusChange(callback: (workspace: Workspace) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = async (payload: WorkspaceStreamData): Promise<void> => {
            const workspace = await getData(this).controller.getWorkspace((wsp) => wsp.id === payload.workspaceSummary.id);
            callback(workspace);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "focus",
            streamType: "workspace",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onWorkspaceClosing(callback: (workspace: Workspace) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = async (payload: WorkspaceStreamData): Promise<void> => {
            const workspace = await getData(this).controller.getWorkspace((wsp) => wsp.id === payload.workspaceSummary.id);
            callback(workspace);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "focus",
            streamType: "workspace",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onWorkspaceClosed(callback: (closed: { frameId: string; workspaceId: string }) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = (payload: WorkspaceStreamData): void => {
            // tslint:disable-next-line: no-console
            console.log("workspace closed callback invoked");
            callback({ frameId: payload.frameSummary.id, workspaceId: payload.workspaceSummary.id });
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "closed",
            streamType: "workspace",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onWindowAdded(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            const foundParent = await getData(this).controller.getParent((parent) => parent.id === payload.windowSummary.parentId);
            const foundWindow = foundParent.getChild((child) => child.type === "window" && child.positionIndex === payload.windowSummary.config.positionIndex);
            callback(foundWindow as WorkspaceWindow);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "added",
            streamType: "window",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onWindowRemoved(callback: (removed: { windowId?: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = (payload: WindowStreamData): void => {
            const { windowId, workspaceId, frameId } = payload.windowSummary.config;
            callback({ windowId, workspaceId, frameId });
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "removed",
            streamType: "window",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onWindowLoaded(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            // const currentWorkspace = (await getData(this).controller.getWorkspace((w) => w.id === payload.windowSummary.config.workspaceId));
            // await currentWorkspace.refreshReference();
            // // tslint:disable-next-line: no-console
            // console.log("Actual payload", payload);

            // const foundParent = currentWorkspace.getParent((p) => {
            //     // tslint:disable-next-line: no-console
            //     console.log("checked parent", p);
            //     return p.id === payload.windowSummary.parentId;
            // });
            const foundParent = await getData(this).controller.getParent((parent) => {
                // tslint:disable-next-line: no-console
                console.log("Parent checked", parent);
                return parent.id === payload.windowSummary.parentId;
            });
            const foundWindow = foundParent.getChild((child) => child.type === "window" && child.positionIndex === payload.windowSummary.config.positionIndex);
            callback(foundWindow as WorkspaceWindow);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "loaded",
            streamType: "window",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onWindowFocusChange(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            const foundParent = await getData(this).controller.getParent((parent) => parent.id === payload.windowSummary.parentId);
            const foundWindow = foundParent.getChild((child) => child.type === "window" && child.positionIndex === payload.windowSummary.config.positionIndex);
            callback(foundWindow as WorkspaceWindow);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "focus",
            streamType: "window",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onParentAdded(callback: (parent: Row | Column | Group) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = async (payload: ContainerStreamData): Promise<void> => {
            const foundParent = await getData(this).controller.getParent((parent) => parent.id === payload.containerSummary.itemId);
            callback(foundParent);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "added",
            streamType: "container",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onParentRemoved(callback: (removed: { id: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = (payload: ContainerStreamData): void => {
            const { workspaceId, frameId } = payload.containerSummary.config;
            callback({ id: payload.containerSummary.itemId, workspaceId, frameId });
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "removed",
            streamType: "container",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }

    public async onParentUpdated(callback: (parent: Row | Column | Group) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const myId = getData(this).summary.id;

        const wrappedCallback = async (payload: ContainerStreamData): Promise<void> => {
            const foundParent = await getData(this).controller.getParent((parent) => parent.id === payload.containerSummary.itemId);
            callback(foundParent);
        };

        const config: SubscriptionConfig = {
            callback: wrappedCallback,
            action: "childrenUpdate",
            streamType: "container",
            level: "frame"
        };
        const unsubscribe = await getData(this).controller.processLocalSubscription(config, myId);
        return unsubscribe;
    }
}
