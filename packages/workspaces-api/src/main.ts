import { IoC } from "./shared/ioc";
import { checkThrowCallback, nonEmptyStringDecoder, swimlaneLayoutDecoder, workspaceDefinitionDecoder, workspaceBuilderCreateConfigDecoder, builderConfigDecoder, restoreWorkspaceConfigDecoder, workspaceLayoutSaveConfigDecoder } from "./shared/decoders";
import { FrameStreamData, WorkspaceStreamData, WorkspaceSnapshotResult, WindowStreamData, ContainerStreamData } from "./types/protocol";
import { FrameCreateConfig, WorkspaceIoCCreateConfig } from "./types/ioc";
import { API, BuilderConfig, WorkspaceBuilder, ParentBuilder, Frame, WorkspaceSummary, Workspace, WorkspaceWindow, WorkspaceParent, RestoreWorkspaceConfig, WorkspaceDefinition, WorkspaceCreateConfig, WorkspaceLayoutSummary, WorkspaceLayout, Unsubscribe, WorkspaceLayoutSaveConfig } from "./../workspaces";
import { WorkspacesController } from "./types/controller";
import { WindowsAPI, LayoutsAPI, InteropAPI } from "./types/glue";

export default (agm: InteropAPI, windows: WindowsAPI, layoutsAPI: LayoutsAPI, ioc?: IoC): API => {
    // this is done for maximum ease of unit testing
    ioc = ioc || new IoC(agm, windows, layoutsAPI);

    const moduleReadyPromise = ioc.initiate();

    const controller: WorkspacesController = ioc.controller;

    const ready = (): Promise<void> => {
        return moduleReadyPromise;
    };

    const inWorkspace = (): Promise<boolean> => {
        const myId = windows.my().id;

        if (!myId) {
            throw new Error("Cannot get my frame, because my id is undefined.");
        }

        return controller.checkIsInSwimlane(myId);
    };

    const getBuilder = (config: BuilderConfig): WorkspaceBuilder | ParentBuilder => {
        const validatedConfig = builderConfigDecoder.runWithException(config);

        return ioc.getBuilder(validatedConfig);
    };

    const getMyFrame = async (): Promise<Frame> => {
        const windowId = windows.my().id;

        if (!windowId) {
            throw new Error("Cannot get my frame, because my id is undefined.");
        }

        const isInSwimlane = await controller.checkIsInSwimlane(windowId);

        if (!isInSwimlane) {
            throw new Error("Cannot fetch your frame, because this window is not in a workspace");
        }

        return controller.getFrame({ windowId });
    };

    const getFrame = async (predicate: (frame: Frame) => boolean): Promise<Frame> => {
        checkThrowCallback(predicate);

        return controller.getFrame({ predicate });
    };

    const getAllFrames = async (predicate?: (frame: Frame) => boolean): Promise<Frame[]> => {
        checkThrowCallback(predicate, true);

        return controller.getFrames(predicate);
    };

    const getAllWorkspacesSummaries = (): Promise<WorkspaceSummary[]> => {
        return controller.getAllWorkspaceSummaries();
    };

    const getMyWorkspace = async (): Promise<Workspace> => {
        const myId = windows.my().id;

        if (!myId) {
            throw new Error("Cannot get my workspace, because my id is undefined.");
        }

        const isInSwimlane = await controller.checkIsInSwimlane(myId);

        if (!isInSwimlane) {
            throw new Error("Cannot fetch your workspace, because this window is not in a workspace");
        }

        return (await controller.getWorkspaces((wsp) => !!wsp.getWindow((w) => w.id === myId)))[0];
    };

    const getWorkspace = async (predicate: (workspace: Workspace) => boolean): Promise<Workspace> => {
        checkThrowCallback(predicate);
        return (await controller.getWorkspaces(predicate))[0];
    };

    const getAllWorkspaces = (predicate?: (workspace: Workspace) => boolean): Promise<Workspace[]> => {
        checkThrowCallback(predicate, true);
        return controller.getWorkspaces(predicate);
    };

    const getWindow = async (predicate: (swimlaneWindow: WorkspaceWindow) => boolean): Promise<WorkspaceWindow> => {
        checkThrowCallback(predicate);
        return controller.getWindow(predicate);
    };

    const getParent = async (predicate: (parent: WorkspaceParent) => boolean): Promise<WorkspaceParent> => {
        checkThrowCallback(predicate);
        return controller.getParent(predicate);
    };

    const restoreWorkspace = async (name: string, options?: RestoreWorkspaceConfig): Promise<Workspace> => {
        nonEmptyStringDecoder.runWithException(name);
        const validatedOptions = restoreWorkspaceConfigDecoder.runWithException(options);
        return controller.restoreWorkspace(name, validatedOptions);
    };

    const createWorkspace = async (definition: WorkspaceDefinition, saveConfig?: WorkspaceCreateConfig): Promise<Workspace> => {
        const validatedDefinition = workspaceDefinitionDecoder.runWithException(definition);
        const validatedConfig = workspaceBuilderCreateConfigDecoder.runWithException(saveConfig);

        return controller.createWorkspace(validatedDefinition, validatedConfig);
    };

    const layouts = {
        getSummaries: (): Promise<WorkspaceLayoutSummary[]> => {
            return controller.getLayoutSummaries();
        },
        delete: async (name: string): Promise<void> => {
            nonEmptyStringDecoder.runWithException(name);
            return controller.deleteLayout(name);
        },
        export: async (predicate?: (layout: WorkspaceLayout) => boolean): Promise<WorkspaceLayout[]> => {
            checkThrowCallback(predicate, true);
            return controller.exportLayout(predicate);
        },
        import: async (layout: WorkspaceLayout): Promise<void> => {
            swimlaneLayoutDecoder.runWithException(layout);
            return controller.importLayout(layout);
        },
        save: async (config: WorkspaceLayoutSaveConfig): Promise<WorkspaceLayout> => {
            const verifiedConfig = workspaceLayoutSaveConfigDecoder.runWithException(config);
            return controller.saveLayout(verifiedConfig);
        }
    };

    const onFrameOpened = async (callback: (frame: Frame) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);

        const wrappedCallback = (payload: FrameStreamData): void => {
            const frameConfig: FrameCreateConfig = {
                summary: payload.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);
            callback(frame);
        };

        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "frame", "opened");
        return unsubscribe;
    };

    const onFrameClosing = async (callback: (frame: Frame) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = (payload: FrameStreamData): void => {
            const frameConfig: FrameCreateConfig = {
                summary: payload.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);
            callback(frame);
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "frame", "closing");
        return unsubscribe;
    };

    const onFrameClosed = async (callback: (closed: { frameId: string }) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = (payload: FrameStreamData): void => {
            callback({ frameId: payload.frameSummary.id });
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "frame", "closed");
        return unsubscribe;
    };

    const onFrameFocusChange = async (callback: (frame: Frame) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = (payload: FrameStreamData): void => {
            const frameConfig: FrameCreateConfig = {
                summary: payload.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);
            callback(frame);
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "frame", "focus");
        return unsubscribe;
    };

    const onWorkspaceOpened = async (callback: (workspace: Workspace) => void): Promise<Unsubscribe> => {
        // tslint:disable-next-line: no-console
        console.log("test 123");

        checkThrowCallback(callback);
        const wrappedCallback = async (payload: WorkspaceStreamData): Promise<void> => {
            const frameConfig: FrameCreateConfig = {
                summary: payload.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);

            const snapshot = (await controller.getSnapshot(payload.workspaceSummary.id, "workspace")) as WorkspaceSnapshotResult;

            const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

            const workspace = ioc.getModel<"workspace">("workspace", workspaceConfig);

            callback(workspace);
        };
        // tslint:disable-next-line: no-console
        console.log("trying to subscribe for workspace opened");
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "workspace", "opened");
        // tslint:disable-next-line: no-console
        console.log("subscribed for workspace opened");
        return unsubscribe;
    };

    const onWorkspaceClosing = async (callback: (workspace: Workspace) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = async (payload: WorkspaceStreamData): Promise<void> => {
            const frameConfig: FrameCreateConfig = {
                summary: payload.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);

            const snapshot = (await controller.getSnapshot(payload.workspaceSummary.id, "workspace")) as WorkspaceSnapshotResult;

            const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

            const workspace = ioc.getModel<"workspace">("workspace", workspaceConfig);

            callback(workspace);
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "workspace", "closing");
        return unsubscribe;
    };

    const onWorkspaceClosed = async (callback: (closed: { frameId: string; workspaceId: string }) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);

        const wrappedCallback = (payload: WorkspaceStreamData): void => {
            callback({ frameId: payload.frameSummary.id, workspaceId: payload.workspaceSummary.id });
        };

        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "workspace", "closed");
        return unsubscribe;
    };

    const onWorkspaceFocusChange = async (callback: (workspace: Workspace) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = async (payload: WorkspaceStreamData): Promise<void> => {
            const frameConfig: FrameCreateConfig = {
                summary: payload.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);

            const snapshot = (await controller.getSnapshot(payload.workspaceSummary.id, "workspace")) as WorkspaceSnapshotResult;

            const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

            const workspace = ioc.getModel<"workspace">("workspace", workspaceConfig);

            callback(workspace);
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "workspace", "focus");
        return unsubscribe;
    };

    const onWindowAdded = async (callback: (swimlaneWindow: WorkspaceWindow) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            const snapshot = (await controller.getSnapshot(payload.windowSummary.config.workspaceId, "workspace")) as WorkspaceSnapshotResult;

            const frameConfig: FrameCreateConfig = {
                summary: snapshot.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);

            const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

            const workspace = ioc.getModel<"workspace">("workspace", workspaceConfig);

            const windowParent = workspace.getParent((parent) => parent.id === payload.windowSummary.parentId);
            const foundWindow = windowParent.getChild((child) => child.type === "window" && child.positionIndex === payload.windowSummary.config.positionIndex);

            callback(foundWindow as WorkspaceWindow);
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "window", "added");
        return unsubscribe;
    };

    const onWindowLoaded = async (callback: (swimlaneWindow: WorkspaceWindow) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            const snapshot = (await controller.getSnapshot(payload.windowSummary.config.workspaceId, "workspace")) as WorkspaceSnapshotResult;

            const frameConfig: FrameCreateConfig = {
                summary: snapshot.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);

            const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

            const workspace = ioc.getModel<"workspace">("workspace", workspaceConfig);

            const foundWindow = workspace.getWindow((win) => win.id && win.id === payload.windowSummary.config.windowId);

            callback(foundWindow);
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "window", "loaded");
        return unsubscribe;
    };

    const onWindowRemoved = async (callback: (removed: { windowId: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = (payload: WindowStreamData): void => {
            const { windowId, workspaceId, frameId } = payload.windowSummary.config;
            callback({ windowId, workspaceId, frameId });
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "window", "removed");
        return unsubscribe;
    };

    const onWindowFocusChange = async (callback: (swimlaneWindow: WorkspaceWindow) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            const snapshot = (await controller.getSnapshot(payload.windowSummary.config.workspaceId, "workspace")) as WorkspaceSnapshotResult;

            const frameConfig: FrameCreateConfig = {
                summary: snapshot.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);

            const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

            const workspace = ioc.getModel<"workspace">("workspace", workspaceConfig);

            const foundWindow = workspace.getWindow((win) => win.id && win.id === payload.windowSummary.config.windowId);

            callback(foundWindow);
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "window", "focus");
        return unsubscribe;
    };

    const onParentAdded = async (callback: (parent: WorkspaceParent) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = async (payload: ContainerStreamData): Promise<void> => {
            const snapshot = (await controller.getSnapshot(payload.containerSummary.config.workspaceId, "workspace")) as WorkspaceSnapshotResult;

            const frameConfig: FrameCreateConfig = {
                summary: snapshot.frameSummary
            };
            const frame = ioc.getModel<"frame">("frame", frameConfig);

            const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

            const workspace = ioc.getModel<"workspace">("workspace", workspaceConfig);
            const foundParent = workspace.getParent((parent) => parent.id === payload.containerSummary.itemId);
            callback(foundParent);
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "container", "added");
        return unsubscribe;
    };

    const onParentRemoved = async (callback: (removed: { id: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe> => {
        checkThrowCallback(callback);
        const wrappedCallback = (payload: ContainerStreamData): void => {
            const { workspaceId, frameId } = payload.containerSummary.config;
            callback({ id: payload.containerSummary.itemId, workspaceId, frameId });
        };
        const unsubscribe = await controller.processGlobalSubscription(wrappedCallback, "container", "removed");
        return unsubscribe;
    };

    return {
        ready,
        inWorkspace,
        getBuilder,
        getMyFrame,
        getFrame,
        getAllFrames,
        getAllWorkspacesSummaries,
        getMyWorkspace,
        getWorkspace,
        getAllWorkspaces,
        getWindow,
        getParent,
        restoreWorkspace,
        createWorkspace,
        layouts,
        onFrameOpened,
        onFrameClosing,
        onFrameClosed,
        onFrameFocusChange,
        onWorkspaceOpened,
        onWorkspaceClosing,
        onWorkspaceClosed,
        onWorkspaceFocusChange,
        onWindowAdded,
        onWindowLoaded,
        onWindowRemoved,
        onWindowFocusChange,
        onParentAdded,
        onParentRemoved
    };
};
