/* eslint-disable @typescript-eslint/no-explicit-any */

export type Unsubscribe = () => void;

export interface RestoreWorkspaceConfig {
    context?: object;
    title?: string;
    frameId?: string;
    newFrame?: NewFrameConfig | boolean;
}

export interface NewFrameConfig {
    bounds?: { top?: number; left?: number; width?: number; height?: number };
}

export interface ResizeConfig {
    width?: number;
    height?: number;
    relative?: boolean;
}

export interface MoveConfig {
    top?: number;
    left?: number;
    relative?: boolean;
}

export interface WorkspaceCreateConfig {
    saveLayout?: boolean;
}

export type RestoreType = "direct" | "delayed" | "lazy";

export type WorkspaceChild = Row | Column | Group | WorkspaceWindow;

export type WorkspaceParent = Row | Column | Group;

export interface BuilderConfig {
    type: "workspace" | "row" | "column" | "group";
    definition: WorkspaceDefinition | ParentDefinition;
}

export interface WorkspaceConfig {
    title?: string;
    position?: number;
    isFocused?: boolean;
}

export interface WorkspaceDefinition {
    children?: Array<WorkspaceWindowDefinition | ParentDefinition>;
    context?: any;
    config?: WorkspaceConfig;
    frame?: {
        reuseFrameId?: string;
        newFrame?: NewFrameConfig | boolean;
    };
}

export interface ParentDefinition {
    type?: "column" | "row" | "group";
    children?: Array<WorkspaceWindowDefinition | ParentDefinition>;
}

export interface WorkspaceWindowDefinition {
    type?: "window";
    appName?: string;
    windowId?: string;
}

export interface FrameSummary {
    id: string;
}

export interface WorkspaceSummary {
    id: string;
    frameId: string;
    positionIndex: number;
    title: string;
}

export interface WorkspaceWindowSummary {
    id: string | undefined;
    type: "window";
    frameId: string;
    workspaceId: string;
    positionIndex: number;
    isMaximized: boolean;
    isLoaded: boolean;
    focused: boolean;
    title: string;
}

export interface WorkspaceLayoutSummary {
    name: string;
}

export interface Frame extends FrameSummary {
    resize(config: ResizeConfig): Promise<void>;
    move(config: MoveConfig): Promise<void>;
    focus(): Promise<void>;
    close(): Promise<void>;
    snapshot(): Promise<FrameSnapshot>;
    restoreWorkspace(name: string, options?: RestoreWorkspaceConfig): Promise<Workspace>;
    createWorkspace(definition: WorkspaceDefinition, config?: WorkspaceCreateConfig): Promise<Workspace>;
    onClosing(callback: (frame: Frame) => void): Promise<Unsubscribe>;
    onClosed(callback: (closed: { frameId: string }) => void): Promise<Unsubscribe>;
    onFocusChange(callback: (frame: Frame) => void): Promise<Unsubscribe>;
    onWorkspaceOpened(callback: (workspace: Workspace) => void): Promise<Unsubscribe>;
    onWorkspaceClosing(callback: (workspace: Workspace) => void): Promise<Unsubscribe>;
    onWorkspaceClosed(callback: (closed: { frameId: string; workspaceId: string }) => void): Promise<Unsubscribe>;
    onWorkspaceFocusChange(callback: (workspace: Workspace) => void): Promise<Unsubscribe>;
    onWindowAdded(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onWindowRemoved(callback: (removed: { windowId?: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe>;
    onWindowLoaded(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onWindowFocusChange(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onParentAdded(callback: (parent: WorkspaceParent) => void): Promise<Unsubscribe>;
    onParentRemoved(callback: (removed: { id: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe>;
    onParentUpdated(callback: (parent: WorkspaceParent) => void): Promise<Unsubscribe>;
}

export interface Workspace extends WorkspaceSummary {
    focus(): Promise<void>;
    close(): Promise<void>;
    snapshot(): Promise<WorkspaceSnapshot>;
    setTitle(title: string): Promise<void>;
    refreshReference(): Promise<void>;
    saveLayout(name: string): Promise<void>;
    getMyFrame(): Frame;
    getChild(predicate: (child: WorkspaceChild) => boolean): WorkspaceChild;
    getAllChildren(predicate?: (child: WorkspaceChild) => boolean): WorkspaceChild[];
    getParent(predicate: (parent: WorkspaceParent) => boolean): WorkspaceParent;
    getAllParents(predicate?: (parent: WorkspaceParent) => boolean): WorkspaceParent[];
    getRow(predicate: (row: Row) => boolean): Row;
    getAllRows(predicate?: (row: Row) => boolean): Row[];
    getColumn(predicate: (column: Column) => boolean): Column;
    getAllColumns(predicate?: (columns: Column) => boolean): Column[];
    getGroup(predicate: (group: Group) => boolean): Group;
    getAllGroups(predicate?: (group: Group) => boolean): Group[];
    getWindow(predicate: (window: WorkspaceWindow) => boolean): WorkspaceWindow;
    getAllWindows(predicate?: (window: WorkspaceWindow) => boolean): WorkspaceWindow[];
    addRow(definition?: ParentDefinition): Promise<Row>;
    addColumn(definition?: ParentDefinition): Promise<Column>;
    addGroup(definition?: ParentDefinition): Promise<Group>;
    addWindow(definition: WorkspaceWindowDefinition): Promise<WorkspaceWindow>;
    remove(predicate: (child: WorkspaceChild) => boolean): Promise<void>;
    removeChild(predicate: (child: WorkspaceChild) => boolean): Promise<void>;
    bundleToRow(): Promise<void>;
    bundleToColumn(): Promise<void>;
    onClosing(callback: () => void): Promise<Unsubscribe>;
    onClosed(callback: () => void): Promise<Unsubscribe>;
    onFocusChange(callback: () => void): Promise<Unsubscribe>;
    onWindowAdded(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onWindowRemoved(callback: (removed: { windowId?: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe>;
    onWindowLoaded(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onWindowFocusChange(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onParentAdded(callback: (parent: Row | Column | Group) => void): Promise<Unsubscribe>;
    onParentRemoved(callback: (removed: { id: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe>;
    onParentUpdated(callback: (parent: Row | Column | Group) => void): Promise<Unsubscribe>;
}

export interface ParentSummary {
    id: string;
    frameId: string;
    workspaceId: string;
    positionIndex: number;
}

export interface Parent extends ParentSummary {
    getChild(predicate: (child: WorkspaceChild) => boolean): WorkspaceChild;
    getAllChildren(predicate?: (child: WorkspaceChild) => boolean): Array<WorkspaceChild>;
    getMyParent(): Workspace | WorkspaceParent;
    getMyFrame(): Frame;
    getMyWorkspace(): Workspace;
    addWindow(definition: WorkspaceWindowDefinition): Promise<WorkspaceWindow>;
    addGroup(definition?: ParentDefinition | ParentBuilder): Promise<Group>;
    addColumn(definition?: ParentDefinition | ParentBuilder): Promise<Column>;
    addRow(definition?: ParentDefinition | ParentBuilder): Promise<Row>;
    removeChild(predicate: (child: WorkspaceChild) => boolean): Promise<void>;
    maximize(): Promise<void>;
    restore(): Promise<void>;
    close(): Promise<void>;
}

export interface Row extends Parent {
    type: "row";
}

export interface Column extends Parent {
    type: "column";
}

export interface Group extends Parent {
    type: "group";
}

export interface WorkspaceWindow extends WorkspaceWindowSummary {
    myWorkspace: Workspace;
    myFrame: Frame;
    myParent: Workspace | WorkspaceParent;
    forceLoad(): Promise<void>;
    focus(): Promise<void>;
    close(): Promise<void>;
    setTitle(title: string): Promise<void>;
    maximize(): Promise<void>;
    restore(): Promise<void>;
    eject(): Promise<any>;
    getGdWindow(): any;
    moveTo(parent: WorkspaceParent): Promise<void>;
    onAdded(callback: () => void): Promise<Unsubscribe>;
    onLoaded(callback: () => void): Promise<Unsubscribe>;
    onParentChanged(callback: (newParent: WorkspaceParent | Workspace) => void): Promise<Unsubscribe>;
    onRemoved(callback: () => void): Promise<Unsubscribe>;
}

export interface WorkspaceBuilder {
    addColumn(definition?: ParentDefinition): ParentBuilder;
    addRow(definition?: ParentDefinition): ParentBuilder;
    addGroup(definition?: ParentDefinition): ParentBuilder;
    addWindow(definition: WorkspaceWindowDefinition): WorkspaceBuilder;
    create(config?: WorkspaceCreateConfig): Promise<Workspace>;
}

export interface ParentBuilder {
    addRow(definition?: ParentDefinition): ParentBuilder;
    addColumn(definition?: ParentDefinition): ParentBuilder;
    addGroup(definition?: ParentDefinition): ParentBuilder;
    addWindow(definition: WorkspaceWindowDefinition): ParentBuilder;
    serialize(): ParentDefinition;
}

export interface WorkspaceLayout {
    name: string;
    layout?: CustomWorkspaceSnapshot;
    workspaceId?: string;
}

export interface WorkspaceLayoutSaveConfig {
    name: string;
    workspaceId: string;
}

export interface FrameSnapshot {
    id: string;
}

export interface WorkspaceSnapshot {
    id: string;
    // children: WorkspaceChild[]
}

export interface CustomWorkspaceSnapshot {
    id?: string;
    children: Array<WorkspaceWindowDefinition | ParentDefinition>;
}

export interface API {
    inWorkspace(): Promise<boolean>;
    getBuilder(config: BuilderConfig): WorkspaceBuilder | ParentBuilder;
    getMyFrame(): Promise<Frame>;
    getFrame(predicate: (frame: Frame) => boolean): Promise<Frame>;
    getAllFrames(predicate?: (frame: Frame) => boolean): Promise<Frame[]>;
    getAllWorkspacesSummaries(): Promise<WorkspaceSummary[]>;
    getMyWorkspace(): Promise<Workspace>;
    getWorkspace(predicate: (workspace: Workspace) => boolean): Promise<Workspace>;
    getAllWorkspaces(predicate?: (workspace: Workspace) => boolean): Promise<Workspace[]>;
    getWindow(predicate: (workspaceWindow: WorkspaceWindow) => boolean): Promise<WorkspaceWindow>;
    getParent(predicate: (parent: WorkspaceParent) => boolean): Promise<WorkspaceParent>;
    restoreWorkspace(name: string, options?: RestoreWorkspaceConfig): Promise<Workspace>;
    createWorkspace(definition: WorkspaceDefinition, saveConfig?: WorkspaceCreateConfig): Promise<Workspace>;
    layouts: {
        getSummaries(): Promise<WorkspaceLayoutSummary[]>;
        delete(name: string): Promise<void>;
        export(predicate?: (layout: WorkspaceLayout) => boolean): Promise<WorkspaceLayout[]>;
        import(layout: WorkspaceLayout): Promise<void>;
        save(config: WorkspaceLayoutSaveConfig): Promise<WorkspaceLayout>;
    };
    onFrameOpened(callback: (frame: Frame) => void): Promise<Unsubscribe>;
    onFrameClosing(callback: (frame: Frame) => void): Promise<Unsubscribe>;
    onFrameClosed(callback: (closed: { frameId: string }) => void): Promise<Unsubscribe>;
    onFrameFocusChange(callback: (frame: Frame) => void): Promise<Unsubscribe>;
    onWorkspaceOpened(callback: (workspace: Workspace) => void): Promise<Unsubscribe>;
    onWorkspaceClosing(callback: (workspace: Workspace) => void): Promise<Unsubscribe>;
    onWorkspaceClosed(callback: (closed: { frameId: string; workspaceId: string }) => void): Promise<Unsubscribe>;
    onWorkspaceFocusChange(callback: (workspace: Workspace) => void): Promise<Unsubscribe>;
    onWindowAdded(callback: (workspaceWindow: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onWindowLoaded(callback: (workspaceWindow: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onWindowRemoved(callback: (removed: { windowId?: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe>;
    onWindowFocusChange(callback: (workspaceWindow: WorkspaceWindow) => void): Promise<Unsubscribe>;
    onParentAdded(callback: (parent: WorkspaceParent) => void): Promise<Unsubscribe>;
    onParentRemoved(callback: (removed: { id: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe>;
}

export type WorkspacesFactoryFunction = (glue: any, config?: any) => API;
declare const WorkspacesFactory: WorkspacesFactoryFunction;
export default WorkspacesFactory;