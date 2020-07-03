import { WorkspaceDefinition, WorkspaceCreateConfig, Workspace, RestoreWorkspaceConfig, WorkspaceWindowDefinition, ParentDefinition, Unsubscribe, Frame, WorkspaceSummary, WorkspaceWindow, WorkspaceParent, WorkspaceLayoutSummary, WorkspaceLayout, ResizeConfig, MoveConfig } from "../../workspaces";
import { AddItemResult, WorkspaceSnapshotResult, FrameSnapshotResult } from "./protocol";
import { SubscriptionConfig, StreamType, StreamAction } from "./subscription";
import { RefreshChildrenConfig } from "./privateData";
import { Child } from "./builders";
import { GDWindow } from "./glue";

export interface WorkspacesController {
    checkIsInSwimlane(windowId: string): Promise<boolean>;
    createWorkspace(definition: WorkspaceDefinition, saveConfig?: WorkspaceCreateConfig): Promise<Workspace>;
    restoreWorkspace(name: string, options?: RestoreWorkspaceConfig): Promise<Workspace>;
    add(type: "container" | "window", parentId: string, parentType: "row" | "column" | "group" | "workspace", definition: WorkspaceWindowDefinition | ParentDefinition): Promise<AddItemResult>;
    processLocalSubscription(config: SubscriptionConfig, levelId: string): Promise<Unsubscribe>;
    processGlobalSubscription(callback: (callbackData: unknown) => void, streamType: StreamType, action: StreamAction): Promise<Unsubscribe>;
    getFrame(selector: { windowId?: string; predicate?: (frame: Frame) => boolean }): Promise<Frame>;
    getFrames(predicate?: (frame: Frame) => boolean): Promise<Frame[]>;
    getWorkspace(predicate: (workspace: Workspace) => boolean): Promise<Workspace>;
    getWorkspaces(predicate?: (workspace: Workspace) => boolean): Promise<Workspace[]>;
    getAllWorkspaceSummaries(): Promise<WorkspaceSummary[]>;
    getWindow(predicate: (swimlaneWindow: WorkspaceWindow) => boolean): Promise<WorkspaceWindow>;
    getParent(predicate: (parent: WorkspaceParent) => boolean): Promise<WorkspaceParent>;
    getLayoutSummaries(): Promise<WorkspaceLayoutSummary[]>;
    deleteLayout(name: string): Promise<void>;
    exportLayout(predicate?: (layout: WorkspaceLayout) => boolean): Promise<WorkspaceLayout[]>;
    bundleTo(type: "row" | "column", workspaceId: string): Promise<void>;
    importLayout(layout: WorkspaceLayout): Promise<void>;
    restoreItem(itemId: string): Promise<void>;
    maximizeItem(itemId: string): Promise<void>;
    focusItem(itemId: string): Promise<void>;
    closeItem(itemId: string): Promise<void>;
    resizeItem(itemId: string, config: ResizeConfig): Promise<void>;
    moveFrame(itemId: string, config: MoveConfig): Promise<void>;
    getGDWindow(itemId: string): GDWindow;
    forceLoadWindow(itemId: string): Promise<string>;
    ejectWindow(itemId: string): Promise<void>;
    moveWindowTo(itemId: string, newParentId: string): Promise<void>;
    getSnapshot(itemId: string, type: "workspace" | "frame"): Promise<WorkspaceSnapshotResult | FrameSnapshotResult>;
    setItemTitle(itemId: string, title: string): Promise<void>;
    refreshChildren(config: RefreshChildrenConfig): Child[];
    iterateFindChild(children: Child[], predicate: (child: Child) => boolean): Child;
    iterateFilterChildren(children: Child[], predicate: (child: Child) => boolean): Child[];
}
