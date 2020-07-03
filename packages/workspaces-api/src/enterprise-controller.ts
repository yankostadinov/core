import { Bridge } from "./communication/bridge";
import { IsWindowInSwimlaneResult, WorkspaceCreateConfigProtocol, WorkspaceSnapshotResult, FrameSummaryResult, FrameSummariesResult, WorkspaceSummariesResult, LayoutSummariesResult, ExportedLayoutsResult, FrameSnapshotResult, SimpleWindowOperationSuccessResult, AddItemResult, SwimlaneWindowSnapshotConfig, ParentSnapshotConfig } from "./types/protocol";
import { OPERATIONS } from "./communication/constants";
import { SubscriptionConfig, StreamType, StreamAction } from "./types/subscription";
import { Workspace } from "./models/workspace";
import { Frame } from "./models/frame";
import { Child } from "./types/builders";
import { Window } from "./models/window";
import { IoC } from "./shared/ioc";
import { FrameCreateConfig, WorkspaceIoCCreateConfig, WindowCreateConfig, ParentCreateConfig } from "./types/ioc";
import { RefreshChildrenConfig } from "./types/privateData";
import { PrivateDataManager } from "./privateDataManager";
import { WorkspaceDefinition, RestoreWorkspaceConfig, WorkspaceWindowDefinition, ParentDefinition, Unsubscribe, WorkspaceSummary, WorkspaceWindow, WorkspaceParent, WorkspaceLayoutSummary, WorkspaceLayout, ResizeConfig, MoveConfig, WorkspaceCreateConfig } from "../workspaces";
import { WorkspacesController } from "./types/controller";
import { WindowsAPI, GDWindow } from "./types/glue";

export class EnterpriseController implements WorkspacesController {

    constructor(
        private readonly bridge: Bridge,
        private readonly windows: WindowsAPI,
        private readonly ioc: IoC,
        private readonly privateDataManager: PrivateDataManager
    ) { }

    public async checkIsInSwimlane(windowId: string): Promise<boolean> {

        const controlResult = await this.bridge.send<IsWindowInSwimlaneResult>(OPERATIONS.isWindowInWorkspace.name, { itemId: windowId });

        return controlResult.inWorkspace;
    }

    public async createWorkspace(definition: WorkspaceDefinition, saveConfig?: WorkspaceCreateConfig): Promise<Workspace> {
        const createConfig: WorkspaceCreateConfigProtocol = Object.assign({}, definition, { saveConfig });

        const snapshot = await this.bridge.send<WorkspaceSnapshotResult>(OPERATIONS.createWorkspace.name, createConfig);
        // tslint:disable-next-line: no-console
        console.log("create workspace snapshot received", snapshot);
        const frameConfig: FrameCreateConfig = {
            summary: snapshot.frameSummary
        };
        const frame = this.ioc.getModel<"frame">("frame", frameConfig);

        const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

        return this.ioc.getModel<"workspace">("workspace", workspaceConfig);
    }

    public async restoreWorkspace(name: string, options?: RestoreWorkspaceConfig): Promise<Workspace> {
        const allLayouts = await this.getLayoutSummaries();

        const layoutExists = allLayouts.some((summary) => summary.name === name);

        if (!layoutExists) {
            throw new Error(`This layout: ${name} cannot be restored, because it doesn't exist.`);
        }

        if (options?.frameId) {
            const allFrameSummaries = await this.bridge.send<FrameSummariesResult>(OPERATIONS.getAllFramesSummaries.name);

            const foundMatchingFrame = allFrameSummaries.summaries.some((summary) => summary.id === options.frameId);

            if (!foundMatchingFrame) {
                throw new Error(`Cannot reuse the frame with id: ${options.frameId}, because there is no frame with that ID found`);
            }
        }

        const snapshot = await this.bridge.send<WorkspaceSnapshotResult>(OPERATIONS.openWorkspace.name, { name, restoreOptions: options });

        const frameSummary = await this.bridge.send<FrameSummaryResult>(OPERATIONS.getFrameSummary.name, { itemId: snapshot.config.frameId });
        const frameConfig: FrameCreateConfig = {
            summary: frameSummary
        };
        const frame = this.ioc.getModel<"frame">("frame", frameConfig);

        const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

        return this.ioc.getModel<"workspace">("workspace", workspaceConfig);
    }

    public async add(type: "container" | "window", parentId: string, parentType: "row" | "column" | "group" | "workspace", definition: WorkspaceWindowDefinition | ParentDefinition): Promise<AddItemResult> {
        let operationName: string;
        const operationArgs = { definition, parentId, parentType };

        if (type === "window") {
            operationName = OPERATIONS.addWindow.name;
        } else if (type === "container") {
            operationName = OPERATIONS.addContainer.name;
        } else {
            throw new Error(`Unrecognized add type: ${type}`);
        }

        return await this.bridge.send<AddItemResult>(operationName, operationArgs);
    }

    public processLocalSubscription(config: SubscriptionConfig, levelId: string): Promise<Unsubscribe> {
        config.levelId = config.levelId || levelId;
        // tslint:disable-next-line: no-console
        console.log("local sub with config", config);
        return this.bridge.subscribe(config);
    }

    public processGlobalSubscription(callback: (callbackData: unknown) => void, streamType: StreamType, action: StreamAction): Promise<Unsubscribe> {
        const config: SubscriptionConfig = {
            streamType, callback, action,
            level: "global",
        };
        return this.bridge.subscribe(config);
    }

    public async getFrame(selector: { windowId?: string; predicate?: (frame: Frame) => boolean }): Promise<Frame> {
        if (selector.windowId) {

            const frameSummary = await this.bridge.send<FrameSummaryResult>(OPERATIONS.getFrameSummary.name, { itemId: selector.windowId });

            const frameConfig: FrameCreateConfig = {
                summary: frameSummary
            };
            return this.ioc.getModel<"frame">("frame", frameConfig);
        }

        if (selector.predicate) {
            return (await this.getFrames(selector.predicate))[0];
        }

        throw new Error(`The provided selector is not valid: ${JSON.stringify(selector)}`);
    }

    public async getFrames(predicate?: (frame: Frame) => boolean): Promise<Frame[]> {

        const allFrameSummaries = await this.bridge.send<FrameSummariesResult>(OPERATIONS.getAllFramesSummaries.name);

        return allFrameSummaries.summaries.reduce<Frame[]>((frames, frameSummary) => {

            const frameConfig: FrameCreateConfig = {
                summary: frameSummary
            };
            const frameToCheck = this.ioc.getModel<"frame">("frame", frameConfig);

            if (!predicate || predicate(frameToCheck)) {
                frames.push(frameToCheck);
            }

            return frames;
        }, []);
    }

    public async getWorkspace(predicate: (workspace: Workspace) => boolean): Promise<Workspace> {
        let foundWorkspace: Workspace;

        await this.iterateWorkspaces((wsp, end) => {
            if (predicate(wsp)) {
                foundWorkspace = wsp;
                end();
            }
        });

        return foundWorkspace;
    }

    public async getWorkspaces(predicate?: (workspace: Workspace) => boolean): Promise<Workspace[]> {
        const matchingWorkspaces: Workspace[] = [] as Workspace[];

        await this.iterateWorkspaces((wsp) => {
            if (!predicate || predicate(wsp)) {
                matchingWorkspaces.push(wsp);
            }
        });

        return matchingWorkspaces;
    }

    public async getAllWorkspaceSummaries(): Promise<WorkspaceSummary[]> {
        // todo: fix the empty object
        const allSummariesResult = await this.bridge.send<WorkspaceSummariesResult>(OPERATIONS.getAllWorkspacesSummaries.name, {});

        return allSummariesResult.summaries.map<WorkspaceSummary>((summary) => {
            return {
                id: summary.id,
                frameId: summary.config.frameId,
                positionIndex: summary.config.positionIndex,
                title: summary.config.title
            };
        });
    }

    public async getWindow(predicate: (swimlaneWindow: WorkspaceWindow) => boolean): Promise<WorkspaceWindow> {
        let resultWindow: WorkspaceWindow;

        await this.iterateWorkspaces((wsp, end) => {
            const foundWindow = wsp.getWindow(predicate);

            if (foundWindow) {
                resultWindow = foundWindow;
                end();
            }
        });

        return resultWindow;
    }

    public async getParent(predicate: (parent: WorkspaceParent) => boolean): Promise<WorkspaceParent> {
        let resultParent: WorkspaceParent;

        await this.iterateWorkspaces((wsp, end) => {
            // tslint:disable-next-line: no-console
            console.log("checked wsp", wsp);
            const foundParent = wsp.getParent(predicate);

            if (foundParent) {
                resultParent = foundParent;
                end();
            }
        });

        return resultParent;
    }

    public async getLayoutSummaries(): Promise<WorkspaceLayoutSummary[]> {
        const allLayouts = await this.bridge.send<LayoutSummariesResult>(OPERATIONS.getAllLayoutsSummaries.name);
        return allLayouts.summaries;
    }

    public async deleteLayout(name: string): Promise<void> {
        await this.bridge.send(OPERATIONS.deleteLayout.name, { name });
    }

    public async exportLayout(predicate?: (layout: WorkspaceLayout) => boolean): Promise<WorkspaceLayout[]> {
        const allLayoutsResult = await this.bridge.send<ExportedLayoutsResult>(OPERATIONS.exportAllLayouts.name);
        return allLayoutsResult.layouts.reduce<WorkspaceLayout[]>((matchingLayouts, layout) => {

            if (!predicate || predicate(layout)) {
                matchingLayouts.push(layout);
            }

            return matchingLayouts;
        }, []);
    }

    public async bundleTo(type: "row" | "column", workspaceId: string): Promise<void> {
        await this.bridge.send(OPERATIONS.bundleWorkspace.name, { type, workspaceId });
    }

    public async importLayout(layout: WorkspaceLayout): Promise<void> {
        await this.bridge.send(OPERATIONS.saveLayout.name, layout);
    }

    public async restoreItem(itemId: string): Promise<void> {
        await this.bridge.send(OPERATIONS.restoreItem.name, { itemId });
    }

    public async maximizeItem(itemId: string): Promise<void> {
        await this.bridge.send(OPERATIONS.maximizeItem.name, { itemId });
    }

    public async focusItem(itemId: string): Promise<void> {
        await this.bridge.send(OPERATIONS.focusItem.name, { itemId });
    }

    public async closeItem(itemId: string): Promise<void> {
        await this.bridge.send(OPERATIONS.closeItem.name, { itemId });
    }

    public async resizeItem(itemId: string, config: ResizeConfig): Promise<void> {
        await this.bridge.send(OPERATIONS.resizeItem.name, Object.assign({}, { itemId }, config));
    }

    public async moveFrame(itemId: string, config: MoveConfig): Promise<void> {
        await this.bridge.send(OPERATIONS.moveFrame.name, Object.assign({}, { itemId }, config));
    }

    public getGDWindow(itemId: string): GDWindow {
        return this.windows.list().find((gdWindow) => gdWindow.id === itemId);
    }

    public async forceLoadWindow(itemId: string): Promise<string> {
        const controlResult = await this.bridge.send<SimpleWindowOperationSuccessResult>(OPERATIONS.forceLoadWindow.name, { itemId });

        return controlResult.windowId;
    }

    public async ejectWindow(itemId: string): Promise<void> {
        await this.bridge.send(OPERATIONS.ejectWindow.name, { itemId });
    }

    public async moveWindowTo(itemId: string, newParentId: string): Promise<void> {
        await this.bridge.send(OPERATIONS.moveWindowTo.name, { itemId, containerId: newParentId });
    }

    public async getSnapshot(itemId: string, type: "workspace" | "frame"): Promise<WorkspaceSnapshotResult | FrameSnapshotResult> {
        let result: WorkspaceSnapshotResult | FrameSnapshotResult;

        if (type === "workspace") {
            result = await this.bridge.send<WorkspaceSnapshotResult>(OPERATIONS.getWorkspaceSnapshot.name, { itemId });
        } else if (type === "frame") {
            result = await this.bridge.send<FrameSnapshotResult>(OPERATIONS.getFrameSnapshot.name, { itemId });
        }

        return result;
    }

    public async setItemTitle(itemId: string, title: string): Promise<void> {
        await this.bridge.send(OPERATIONS.setItemTitle.name, { itemId, title });
    }

    public refreshChildren(config: RefreshChildrenConfig): Child[] {
        const { parent, children, existingChildren, workspace } = config;
        if (parent instanceof Window) {
            return;
        }

        const newChildren = children.map((newChildSnapshot) => {
            let childToAdd = existingChildren.find((c) => c.id === newChildSnapshot.id);
            const childType = newChildSnapshot.type;

            if (childToAdd) {
                this.privateDataManager.remapChild(childToAdd, {
                    parent,
                    children: [],
                    config: newChildSnapshot.config
                });
            } else {
                if (childType === "window") {
                    const createConfig: WindowCreateConfig = {
                        id: newChildSnapshot.id,
                        parent,
                        frame: workspace.getMyFrame(),
                        workspace,
                        config: newChildSnapshot.config as SwimlaneWindowSnapshotConfig
                    };
                    childToAdd = this.ioc.getModel<"child">(childType, createConfig);
                } else {
                    const createConfig: ParentCreateConfig = {
                        id: newChildSnapshot.id,
                        children: [],
                        parent,
                        frame: workspace.getMyFrame(),
                        workspace,
                        config: newChildSnapshot.config as ParentSnapshotConfig
                    };
                    childToAdd = this.ioc.getModel<"child">(childType, createConfig);
                }

            }

            if (childType !== "window") {
                this.refreshChildren({
                    workspace, existingChildren,
                    children: newChildSnapshot.children,
                    parent: childToAdd
                });
            }

            return childToAdd;
        });

        if (parent instanceof Workspace) {
            return newChildren;
        } else {
            this.privateDataManager.remapChild(parent, { children: newChildren });
            return newChildren;
        }
    }

    public iterateFindChild(children: Child[], predicate: (child: Child) => boolean): Child {
        let foundChild = children.find((child) => predicate(child));

        if (foundChild) {
            return foundChild;
        }

        children.some((child) => {
            if (child instanceof Window) {
                return false;
            }

            foundChild = this.iterateFindChild(child.getAllChildren(), predicate);

            if (foundChild) {
                return true;
            }
        });

        return foundChild;
    }

    public iterateFilterChildren(children: Child[], predicate: (child: Child) => boolean): Child[] {
        const foundChildren = children.filter((child) => predicate(child));

        const grandChildren = children.reduce<Child[]>((innerFound, child) => {
            if (child instanceof Window) {
                return innerFound;
            }

            innerFound.push(...this.iterateFilterChildren(child.getAllChildren(), predicate));

            return innerFound;
        }, []);

        foundChildren.push(...grandChildren);

        return foundChildren;
    }

    private async iterateWorkspaces(callback: (workspace: Workspace, end: () => void) => void): Promise<void> {
        let ended = false;

        const end = (): void => { ended = true; };

        const workspaceIds = (await this.getAllWorkspaceSummaries()).map((summary) => summary.id);

        for (const workspaceId of workspaceIds) {
            if (ended) {
                return;
            }
            const snapshot = await this.bridge.send<WorkspaceSnapshotResult>(OPERATIONS.getWorkspaceSnapshot.name, { itemId: workspaceId });

            const frameSummary = await this.bridge.send<FrameSummaryResult>(OPERATIONS.getFrameSummary.name, { itemId: snapshot.config.frameId });
            const frameConfig: FrameCreateConfig = {
                summary: frameSummary
            };
            const frame = this.ioc.getModel<"frame">("frame", frameConfig);

            const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

            const wsp = this.ioc.getModel<"workspace">("workspace", workspaceConfig);

            callback(wsp, end);
        }
    }
}
