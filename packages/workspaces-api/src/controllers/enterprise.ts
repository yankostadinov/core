import { Bridge } from "../communication/bridge";
import { IsWindowInSwimlaneResult, WorkspaceCreateConfigProtocol, WorkspaceSnapshotResult, FrameSummariesResult, WorkspaceSummariesResult, LayoutSummariesResult, ExportedLayoutsResult, FrameSnapshotResult, AddItemResult } from "../types/protocol";
import { OPERATIONS } from "../communication/constants";
import { SubscriptionConfig, StreamType, StreamAction } from "../types/subscription";
import { Workspace } from "../models/workspace";
import { Frame } from "../models/frame";
import { Child } from "../types/builders";
import { RefreshChildrenConfig } from "../types/privateData";
import { WorkspaceDefinition, RestoreWorkspaceConfig, WorkspaceWindowDefinition, ParentDefinition, Unsubscribe, WorkspaceSummary, WorkspaceWindow, WorkspaceParent, WorkspaceLayoutSummary, WorkspaceLayout, ResizeConfig, MoveConfig, WorkspaceCreateConfig, WorkspaceLayoutSaveConfig } from "../../workspaces";
import { WorkspacesController } from "../types/controller";
import { GDWindow } from "../types/glue";
import { BaseController } from "./base";

export class EnterpriseController implements WorkspacesController {

    constructor(
        private readonly bridge: Bridge,
        private readonly base: BaseController
    ) { }

    public async checkIsInSwimlane(windowId: string): Promise<boolean> {

        const controlResult = await this.bridge.send<IsWindowInSwimlaneResult>(OPERATIONS.isWindowInWorkspace.name, { itemId: windowId });

        return controlResult.inWorkspace;
    }

    public async createWorkspace(definition: WorkspaceDefinition, saveConfig?: WorkspaceCreateConfig): Promise<Workspace> {
        const createConfig: WorkspaceCreateConfigProtocol = Object.assign({}, definition, { saveConfig });

        return await this.base.createWorkspace(createConfig);
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

        return await this.base.restoreWorkspace(name, options);
    }

    public async add(type: "container" | "window", parentId: string, parentType: "row" | "column" | "group" | "workspace", definition: WorkspaceWindowDefinition | ParentDefinition): Promise<AddItemResult> {
        return await this.base.add(type, parentId, parentType, definition);
    }

    public processLocalSubscription(config: SubscriptionConfig, levelId: string): Promise<Unsubscribe> {
        config.levelId = config.levelId || levelId;

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
            return await this.base.getFrame(selector.windowId);
        }

        if (selector.predicate) {
            return (await this.getFrames(selector.predicate))[0];
        }

        throw new Error(`The provided selector is not valid: ${JSON.stringify(selector)}`);
    }

    public async getFrames(predicate?: (frame: Frame) => boolean): Promise<Frame[]> {

        const allFrameSummaries = await this.bridge.send<FrameSummariesResult>(OPERATIONS.getAllFramesSummaries.name);

        return this.base.getFrames(allFrameSummaries.summaries, predicate);
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

        const allSummariesResult = await this.bridge.send<WorkspaceSummariesResult>(OPERATIONS.getAllWorkspacesSummaries.name, {});

        return this.base.getAllWorkspaceSummaries(allSummariesResult);
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

    public async saveLayout(config: WorkspaceLayoutSaveConfig): Promise<WorkspaceLayout> {
        return await this.bridge.send(OPERATIONS.saveLayout.name, { name: config.name, workspaceId: config.workspaceId });
    }

    public async importLayout(layouts: WorkspaceLayout[]): Promise<void> {
        await Promise.all(layouts.map((layout) => this.bridge.send(OPERATIONS.saveLayout.name, layout)));
    }

    public async bundleTo(type: "row" | "column", workspaceId: string): Promise<void> {
        return await this.base.bundleTo(type, workspaceId);
    }

    public async restoreItem(itemId: string): Promise<void> {
        return await this.base.restoreItem(itemId);
    }

    public async maximizeItem(itemId: string): Promise<void> {
        return await this.base.maximizeItem(itemId);
    }

    public async focusItem(itemId: string): Promise<void> {
        return await this.base.focusItem(itemId);
    }

    public async closeItem(itemId: string): Promise<void> {
        return await this.base.closeItem(itemId);
    }

    public async resizeItem(itemId: string, config: ResizeConfig): Promise<void> {
        return await this.base.resizeItem(itemId, config);
    }

    public async moveFrame(itemId: string, config: MoveConfig): Promise<void> {
        return await this.base.moveFrame(itemId, config);
    }

    public getGDWindow(itemId: string): GDWindow {
        return this.base.getGDWindow(itemId);
    }

    public async forceLoadWindow(itemId: string): Promise<string> {
        return await this.base.forceLoadWindow(itemId);
    }

    public async ejectWindow(itemId: string): Promise<void> {
        return await this.base.ejectWindow(itemId);
    }

    public async moveWindowTo(itemId: string, newParentId: string): Promise<void> {
        return await this.base.moveWindowTo(itemId, newParentId);
    }

    public async getSnapshot(itemId: string, type: "workspace" | "frame"): Promise<WorkspaceSnapshotResult | FrameSnapshotResult> {
        return await this.base.getSnapshot(itemId, type);
    }

    public async setItemTitle(itemId: string, title: string): Promise<void> {
        return await this.base.setItemTitle(itemId, title);
    }

    public refreshChildren(config: RefreshChildrenConfig): Child[] {
        return this.base.refreshChildren(config);
    }

    public iterateFindChild(children: Child[], predicate: (child: Child) => boolean): Child {
        return this.base.iterateFindChild(children, predicate);
    }

    public iterateFilterChildren(children: Child[], predicate: (child: Child) => boolean): Child[] {
        return this.base.iterateFilterChildren(children, predicate);
    }

    private async iterateWorkspaces(callback: (workspace: Workspace, end: () => void) => void): Promise<void> {
        let ended = false;

        const end = (): void => { ended = true; };

        const workspaceSummaries = await this.getAllWorkspaceSummaries();

        for (const summary of workspaceSummaries) {
            if (ended) {
                return;
            }

            const wsp = await this.base.fetchWorkspace(summary.id);

            callback(wsp, end);
        }
    }
}
