import { Bridge } from "./communication/bridge";
import { IoC } from "./shared/ioc";
import { PrivateDataManager } from "./privateDataManager";
import { WorkspacesController } from "./types/controller";
import { WorkspaceDefinition, WorkspaceCreateConfig, RestoreWorkspaceConfig, WorkspaceLayout, ResizeConfig, MoveConfig, Unsubscribe, WorkspaceWindowDefinition, ParentDefinition, Frame, WorkspaceSummary, WorkspaceWindow, WorkspaceParent, WorkspaceLayoutSummary, WorkspaceLayoutSaveConfig } from "../workspaces";
import { RefreshChildrenConfig } from "./types/privateData";
import { AddItemResult, WorkspaceSnapshotResult, FrameSnapshotResult, IsWindowInSwimlaneResult, WorkspaceCreateConfigProtocol, FrameSummaryResult, WorkspaceSummariesResult, WorkspaceSummaryResult, ParentSnapshotConfig, SwimlaneWindowSnapshotConfig, SimpleWindowOperationSuccessResult } from "./types/protocol";
import { Child } from "./types/builders";
import { CoreFrameUtils } from "./communication/core-frame-utils";
import { OPERATIONS } from "./communication/constants";
import { FrameCreateConfig, WorkspaceIoCCreateConfig, ParentCreateConfig, WindowCreateConfig } from "./types/ioc";
import { Window } from "./models/window";
import { Workspace } from "./models/workspace";
import { WindowsAPI, LayoutsAPI, Instance, GDWindow } from "./types/glue";

export class CoreController implements WorkspacesController {
    constructor(
        private readonly bridge: Bridge,
        private readonly windows: WindowsAPI,
        private readonly ioc: IoC,
        private readonly privateDataManager: PrivateDataManager,
        private readonly frameUtils: CoreFrameUtils,
        private readonly layouts: LayoutsAPI
    ) { }

    public async checkIsInSwimlane(windowId: string): Promise<boolean> {

        const allFrames = this.frameUtils.getAllFrameInstances();

        if (!allFrames.length) {
            return false;
        }

        const allResults = await Promise
            .all(allFrames.map((frameInstance) => this.bridge.send<IsWindowInSwimlaneResult>(OPERATIONS.isWindowInWorkspace.name, { itemId: windowId }, frameInstance)));

        return allResults.some((result) => result.inWorkspace);
    }

    public async createWorkspace(definition: WorkspaceDefinition, saveConfig?: WorkspaceCreateConfig): Promise<Workspace> {
        const createConfig: WorkspaceCreateConfigProtocol = Object.assign({}, definition, { saveConfig });
        const frameInstanceConfig = {
            frameId: definition.frame?.reuseFrameId,
            newFrame: definition.frame?.newFrame
        };

        const frameInstance = await this.frameUtils.getFrameInstance(frameInstanceConfig);

        const snapshot = await this.bridge.send<WorkspaceSnapshotResult>(OPERATIONS.createWorkspace.name, createConfig, frameInstance);

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

        const frameInstance: Instance = await this.frameUtils.getFrameInstance({ frameId: options?.frameId });

        const snapshot = await this.bridge.send<WorkspaceSnapshotResult>(OPERATIONS.openWorkspace.name, { name, restoreOptions: options }, frameInstance);

        const frameSummary = await this.bridge.send<FrameSummaryResult>(OPERATIONS.getFrameSummary.name, { itemId: snapshot.config.frameId }, frameInstance);

        const frameConfig: FrameCreateConfig = {
            summary: frameSummary
        };
        const frame = this.ioc.getModel<"frame">("frame", frameConfig);

        const workspaceConfig: WorkspaceIoCCreateConfig = { frame, snapshot };

        return this.ioc.getModel<"workspace">("workspace", workspaceConfig);
    }

    public async add(type: "container" | "window", parentId: string, parentType: "row" | "column" | "group" | "workspace", definition: WorkspaceWindowDefinition | ParentDefinition): Promise<AddItemResult> {

        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(parentId);

        let operationName: string;
        const operationArgs = { definition, parentId, parentType };

        if (type === "window") {
            operationName = OPERATIONS.addWindow.name;
        } else if (type === "container") {
            operationName = OPERATIONS.addContainer.name;
        } else {
            throw new Error(`Unrecognized add type: ${type}`);
        }

        return await this.bridge.send<AddItemResult>(operationName, operationArgs, frameInstance);
    }

    public async processLocalSubscription(): Promise<Unsubscribe> {
        throw new Error("Workspaces events are not supported in Glue42 Core.");
    }

    public async processGlobalSubscription(): Promise<Unsubscribe> {
        throw new Error("Workspaces events are not supported in Glue42 Core.");
    }

    public async getFrame(selector: { windowId?: string; predicate?: (frame: Frame) => boolean }): Promise<Frame> {
        if (selector.windowId) {

            const frameInstance = await this.frameUtils.getFrameInstanceByItemId(selector.windowId);

            const frameSummary = await this.bridge.send<FrameSummaryResult>(OPERATIONS.getFrameSummary.name, { itemId: selector.windowId }, frameInstance);

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

        const allFrameInstances = this.frameUtils.getAllFrameInstances();

        const allFrameSummaries = await Promise.all(allFrameInstances.map((frame) => this.bridge.send<FrameSummaryResult>(OPERATIONS.getFrameSummary.name, { itemId: frame.peerId }, frame)));

        return allFrameSummaries.reduce<Frame[]>((frames, frameSummary) => {

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
        const allFrames = this.frameUtils.getAllFrameInstances();

        const allResults = await Promise.all(allFrames.map((frame) => this.bridge.send<WorkspaceSummariesResult>(OPERATIONS.getAllWorkspacesSummaries.name, {}, frame)));

        const allSummaries = allResults.reduce<WorkspaceSummaryResult[]>((summaries, summaryResult) => {
            summaries.push(...summaryResult.summaries);
            return summaries;
        }, []);

        return allSummaries.map<WorkspaceSummary>((summary) => {
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
            const foundParent = wsp.getParent(predicate);

            if (foundParent) {
                resultParent = foundParent;
                end();
            }
        });

        return resultParent;
    }

    public async getLayoutSummaries(): Promise<WorkspaceLayoutSummary[]> {
        const layouts = await this.layouts.getAll("Workspace");
        return layouts.map((layout) => {
            return {
                name: layout.name
            };
        });
    }

    public async deleteLayout(name: string): Promise<void> {
        await this.layouts.remove("Workspace", name);
    }

    public async exportLayout(predicate?: (layout: WorkspaceLayout) => boolean): Promise<WorkspaceLayout[]> {
        const allLayouts = await this.layouts.export("Workspace");

        return allLayouts.reduce<WorkspaceLayout[]>((matchingLayouts, layout) => {

            if (!predicate || predicate(layout)) {
                matchingLayouts.push(layout);
            }

            return matchingLayouts;
        }, []);
    }

    public async importLayout(layout: WorkspaceLayout): Promise<void> {
        await this.layouts.import(layout);
    }

    public async saveLayout(config: WorkspaceLayoutSaveConfig): Promise<WorkspaceLayout> {

        const framesCount = this.frameUtils.getAllFrameInstances().length;

        if (!framesCount) {
            throw new Error(`Cannot save the layout with config: ${JSON.stringify(config)}, because no active frames were found`);
        }

        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(config.workspaceId);

        return await this.bridge.send<WorkspaceLayout>(OPERATIONS.saveLayout.name, { name: config.name, workspaceId: config.workspaceId }, frameInstance);
    }

    public async bundleTo(type: "row" | "column", workspaceId: string): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(workspaceId);

        await this.bridge.send(OPERATIONS.bundleWorkspace.name, { type, workspaceId }, frameInstance);
    }

    public async restoreItem(itemId: string): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.restoreItem.name, { itemId }, frameInstance);
    }

    public async maximizeItem(itemId: string): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.maximizeItem.name, { itemId }, frameInstance);
    }

    public async focusItem(itemId: string): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.focusItem.name, { itemId }, frameInstance);
    }

    public async closeItem(itemId: string): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.closeItem.name, { itemId }, frameInstance);

        await this.frameUtils.closeFrame(itemId);
    }

    public async resizeItem(itemId: string, config: ResizeConfig): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.resizeItem.name, Object.assign({}, { itemId }, config), frameInstance);
    }

    public async moveFrame(itemId: string, config: MoveConfig): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.moveFrame.name, Object.assign({}, { itemId }, config), frameInstance);
    }

    public getGDWindow(itemId: string): GDWindow {
        return this.windows.list().find((gdWindow) => gdWindow.id === itemId);
    }

    public async forceLoadWindow(itemId: string): Promise<string> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        const controlResult = await this.bridge.send<SimpleWindowOperationSuccessResult>(OPERATIONS.forceLoadWindow.name, { itemId }, frameInstance);

        return controlResult.windowId;
    }

    public async ejectWindow(itemId: string): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.ejectWindow.name, { itemId }, frameInstance);
    }

    public async moveWindowTo(itemId: string, newParentId: string): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.moveWindowTo.name, { itemId, containerId: newParentId }, frameInstance);
    }

    public async getSnapshot(itemId: string, type: "workspace" | "frame"): Promise<WorkspaceSnapshotResult | FrameSnapshotResult> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        let result: WorkspaceSnapshotResult | FrameSnapshotResult;

        if (type === "workspace") {
            result = await this.bridge.send<WorkspaceSnapshotResult>(OPERATIONS.getWorkspaceSnapshot.name, { itemId }, frameInstance);
        } else if (type === "frame") {
            result = await this.bridge.send<FrameSnapshotResult>(OPERATIONS.getFrameSnapshot.name, { itemId }, frameInstance);
        }

        return result;
    }

    public async setItemTitle(itemId: string, title: string): Promise<void> {
        const frameInstance = await this.frameUtils.getFrameInstanceByItemId(itemId);

        await this.bridge.send(OPERATIONS.setItemTitle.name, { itemId, title }, frameInstance);
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

        const workspaceSummaries = await this.getAllWorkspaceSummaries();

        for (const summary of workspaceSummaries) {
            if (ended) {
                return;
            }

            const frameInstance = await this.frameUtils.getFrameInstance({ frameId: summary.frameId });

            const snapshot = await this.bridge.send<WorkspaceSnapshotResult>(OPERATIONS.getWorkspaceSnapshot.name, { itemId: summary.id }, frameInstance);

            const frameSummary = await this.bridge.send<FrameSummaryResult>(OPERATIONS.getFrameSummary.name, { itemId: snapshot.config.frameId }, frameInstance);
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