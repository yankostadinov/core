import { WorkspaceSnapshotResult, WindowStreamData, ContainerStreamData } from "../types/protocol";
import { checkThrowCallback, nonEmptyStringDecoder } from "../shared/decoders";
import { PrivateDataManager } from "../privateDataManager";
import { FrameCreateConfig } from "../types/ioc";
import { Window } from "./window";
import { Frame } from "./frame";
import { Row } from "./row";
import { Column } from "./column";
import { Group } from "./group";
import { SubscriptionConfig } from "../types/subscription";
import { WorkspacePrivateData } from "../types/privateData";
import { WorkspaceChild, WorkspaceSnapshot, WorkspaceParent, WorkspaceWindow, ParentDefinition, WorkspaceWindowDefinition, Unsubscribe } from "../../workspaces";

interface PrivateData {
    manager: PrivateDataManager;
}

const data = new WeakMap<Workspace, PrivateData>();

const getData = (model: Workspace): WorkspacePrivateData => {
    return data.get(model).manager.getWorkspaceData(model);
};

const getDataManager = (model: Workspace): PrivateDataManager => {
    return data.get(model).manager;
};

export class Workspace implements Workspace {

    constructor(dataManager: PrivateDataManager) {
        data.set(this, { manager: dataManager });
    }

    public get id(): string {
        return getData(this).id;
    }

    public get frameId(): string {
        return getData(this).config.frameId;
    }

    public get positionIndex(): number {
        return getData(this).config.positionIndex;
    }

    public get title(): string {
        return getData(this).config.title;
    }

    public async removeChild(predicate: (child: WorkspaceChild) => boolean): Promise<void> {
        checkThrowCallback(predicate);
        const child = this.getChild(predicate);
        if (!child) {
            return;
        }
        await child.close();
        await this.refreshReference();
    }

    public async remove(predicate: (child: WorkspaceChild) => boolean): Promise<void> {
        checkThrowCallback(predicate);
        const controller = getData(this).controller;

        const child = controller.iterateFindChild(this.getAllChildren(), predicate);

        await child.close();

        await this.refreshReference();
    }

    public async focus(): Promise<void> {
        await getData(this).controller.focusItem(this.id);
        await this.refreshReference();
    }

    public async close(): Promise<void> {
        const controller = getData(this).controller;

        await controller.closeItem(this.id);
    }

    public snapshot(): Promise<WorkspaceSnapshot> {
        return getData(this).controller.getSnapshot(this.id, "workspace");
    }

    public async saveLayout(name: string): Promise<void> {
        nonEmptyStringDecoder.runWithException(name);
        await getData(this).controller.saveLayout({name, workspaceId: this.id});
    }

    public async setTitle(title: string): Promise<void> {
        nonEmptyStringDecoder.runWithException(title);
        const controller = getData(this).controller;

        await controller.setItemTitle(this.id, title);
        await this.refreshReference();
    }

    public async refreshReference(): Promise<void> {
        const newSnapshot = (await getData(this).controller.getSnapshot(this.id, "workspace")) as WorkspaceSnapshotResult;
        // tslint:disable-next-line: no-console
        console.log("new workspace snapshot", newSnapshot);
        const existingChildren = newSnapshot.children.reduce<WorkspaceChild[]>((foundChildren, child) => {
            let foundChild: WorkspaceChild;
            if (child.type === "window") {
                foundChild = this.getWindow((swimlaneWindow) => swimlaneWindow.id === child.id);
            } else {
                foundChild = this.getParent((parent) => parent.id === child.id);
            }

            if (foundChild) {
                foundChildren.push(foundChild);
            }

            return foundChildren;
        }, []);

        const newChildren = getData(this).controller.refreshChildren({
            existingChildren,
            workspace: this,
            parent: this,
            children: newSnapshot.children
        });

        const currentFrame = this.getMyFrame();
        let actualFrame: Frame;

        if (currentFrame.id === newSnapshot.config.frameId) {
            getDataManager(this).remapFrame(currentFrame, newSnapshot.frameSummary);
            actualFrame = currentFrame;
        } else {
            const frameCreateConfig: FrameCreateConfig = {
                summary: newSnapshot.frameSummary
            };
            const newFrame = getData(this).ioc.getModel<"frame">("frame", frameCreateConfig);
            actualFrame = newFrame;
        }

        getDataManager(this).remapWorkspace(this, {
            config: newSnapshot.config,
            children: newChildren,
            frame: actualFrame
        });
    }

    public getMyFrame(): Frame {
        return getData(this).frame;
    }

    public getChild(predicate: (child: WorkspaceChild) => boolean): WorkspaceChild {
        checkThrowCallback(predicate);
        return getData(this).children.find(predicate);
    }

    public getAllChildren(predicate?: (child: WorkspaceChild) => boolean): WorkspaceChild[] {
        checkThrowCallback(predicate, true);
        const children = getData(this).children;

        if (!predicate) {
            return children;
        }

        children.filter(predicate);
    }

    public getParent(predicate: (parent: WorkspaceParent) => boolean): WorkspaceParent {
        checkThrowCallback(predicate);
        const children = getData(this).children;
        const controller = getData(this).controller;

        return controller.iterateFindChild(children, (child) => child.type !== "window" && predicate(child)) as WorkspaceParent;
    }

    public getAllParents(predicate?: (parent: WorkspaceParent) => boolean): WorkspaceParent[] {
        checkThrowCallback(predicate, true);
        const children = getData(this).children;
        const controller = getData(this).controller;

        const allParents = controller.iterateFilterChildren(children, (child) => child.type !== "window") as WorkspaceParent[];

        if (!predicate) {
            return allParents;
        }

        return allParents.filter(predicate);
    }

    public getRow(predicate: (row: Row) => boolean): Row {
        checkThrowCallback(predicate);
        return this.getParent((parent) => parent.type === "row" && predicate(parent)) as Row;
    }

    public getAllRows(predicate?: (row: Row) => boolean): Row[] {
        checkThrowCallback(predicate, true);
        if (predicate) {
            return this.getAllParents((parent) => parent.type === "row" && predicate(parent)) as Row[];
        }
        return this.getAllParents((parent) => parent.type === "row") as Row[];
    }

    public getColumn(predicate: (column: Column) => boolean): Column {
        checkThrowCallback(predicate);
        return this.getParent((parent) => parent.type === "column" && predicate(parent)) as Column;
    }

    public getAllColumns(predicate?: (columns: Column) => boolean): Column[] {
        checkThrowCallback(predicate, true);
        if (predicate) {
            return this.getAllParents((parent) => parent.type === "column" && predicate(parent)) as Column[];
        }
        return this.getAllParents((parent) => parent.type === "column") as Column[];
    }

    public getGroup(predicate: (group: Group) => boolean): Group {
        checkThrowCallback(predicate);
        return this.getParent((parent) => parent.type === "group" && predicate(parent)) as Group;
    }

    public getAllGroups(predicate?: (group: Group) => boolean): Group[] {
        checkThrowCallback(predicate, true);
        if (predicate) {
            return this.getAllParents((parent) => parent.type === "group" && predicate(parent)) as Group[];
        }
        return this.getAllParents((parent) => parent.type === "group") as Group[];
    }

    public getWindow(predicate: (window: WorkspaceWindow) => boolean): WorkspaceWindow {
        checkThrowCallback(predicate);
        const children = getData(this).children;
        const controller = getData(this).controller;

        return controller.iterateFindChild(children, (child) => child.type === "window" && predicate(child)) as Window;
    }

    public getAllWindows(predicate?: (window: WorkspaceWindow) => boolean): WorkspaceWindow[] {
        checkThrowCallback(predicate, true);
        const children = getData(this).children;
        const controller = getData(this).controller;

        const allWindows = controller.iterateFilterChildren(children, (child) => child.type === "window") as Window[];

        if (!predicate) {
            return allWindows;
        }

        return allWindows.filter(predicate);
    }

    public addRow(definition?: ParentDefinition): Promise<Row> {
        return getData(this).base.addParent<Row>(this, "row", "workspace", definition);
    }

    public addColumn(definition?: ParentDefinition): Promise<Column> {
        return getData(this).base.addParent<Column>(this, "column", "workspace", definition);
    }

    public addGroup(definition?: ParentDefinition): Promise<Group> {
        return getData(this).base.addParent<Group>(this, "group", "workspace", definition);
    }

    public addWindow(definition: WorkspaceWindowDefinition): Promise<WorkspaceWindow> {
        return getData(this).base.addWindow(this, definition, "workspace");
    }

    public async bundleToRow(): Promise<void> {
        await getData(this).controller.bundleTo("row", this.id);
        await this.refreshReference();
    }

    public async bundleToColumn(): Promise<void> {
        await getData(this).controller.bundleTo("column", this.id);
        await this.refreshReference();
    }

    public async onClosing(callback: () => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;

        const wrappedCallback = async (): Promise<void> => {
            await this.refreshReference();
            callback();
        };

        const config: SubscriptionConfig = {
            action: "closing",
            streamType: "workspace",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onClosed(callback: () => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;

        const wrappedCallback = async (): Promise<void> => {
            // await this.refreshReference();
            callback();
        };
        const config: SubscriptionConfig = {
            action: "closed",
            streamType: "workspace",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onFocusChange(callback: () => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;
        const wrappedCallback = async (): Promise<void> => {
            await this.refreshReference();
            callback();
        };
        const config: SubscriptionConfig = {
            action: "focus",
            streamType: "workspace",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onWindowAdded(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;
        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            await this.refreshReference();
            const windowParent = this.getParent((parent) => parent.id === payload.windowSummary.parentId);
            // tslint:disable-next-line: no-console
            console.log("workspace window added payload", payload);
            const foundWindow = windowParent.getChild((child) => {
                // tslint:disable-next-line: no-console
                console.log("checking child", child);
                return child.type === "window" && child.positionIndex === payload.windowSummary.config.positionIndex;
            });
            callback(foundWindow as Window);
        };

        const config: SubscriptionConfig = {
            action: "added",
            streamType: "window",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onWindowRemoved(callback: (removed: { windowId?: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;

        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            await this.refreshReference();
            const { windowId, workspaceId, frameId } = payload.windowSummary.config;
            callback({ windowId, workspaceId, frameId });
        };

        const config: SubscriptionConfig = {
            action: "removed",
            streamType: "window",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onWindowLoaded(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;

        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            await this.refreshReference();
            // tslint:disable-next-line: no-console
            console.log("payload for window loaded", payload);
            const foundWindow = this.getWindow((win) => {
                // tslint:disable-next-line: no-console
                console.log("Window checked", win);
                return win.id && win.id === payload.windowSummary.config.windowId;
            });
            // tslint:disable-next-line: no-console
            console.log("found window", foundWindow);
            callback(foundWindow);
        };

        const config: SubscriptionConfig = {
            action: "loaded",
            streamType: "window",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onWindowFocusChange(callback: (window: WorkspaceWindow) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;

        const wrappedCallback = async (payload: WindowStreamData): Promise<void> => {
            this.refreshReference();

            const foundWindow = this.getWindow((win) => win.id && win.id === payload.windowSummary.config.windowId);

            callback(foundWindow);
        };

        const config: SubscriptionConfig = {
            action: "focus",
            streamType: "window",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onParentAdded(callback: (parent: WorkspaceParent) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;

        const wrappedCallback = async (payload: ContainerStreamData): Promise<void> => {
            await this.refreshReference();
            const foundParent = this.getParent((parent) => parent.id === payload.containerSummary.itemId);
            callback(foundParent);
        };

        const config: SubscriptionConfig = {
            action: "added",
            streamType: "container",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onParentRemoved(callback: (removed: { id: string; workspaceId: string; frameId: string }) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;

        const wrappedCallback = async (payload: ContainerStreamData): Promise<void> => {
            await this.refreshReference();
            const { workspaceId, frameId } = payload.containerSummary.config;
            callback({ id: payload.containerSummary.itemId, workspaceId, frameId });
        };

        const config: SubscriptionConfig = {
            action: "removed",
            streamType: "container",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }

    public async onParentUpdated(callback: (parent: WorkspaceParent) => void): Promise<Unsubscribe> {
        checkThrowCallback(callback);
        const id = getData(this).id;

        const wrappedCallback = async (payload: ContainerStreamData): Promise<void> => {
            await this.refreshReference();
            const foundParent = this.getParent((parent) => parent.id === payload.containerSummary.itemId);
            callback(foundParent);
        };

        const config: SubscriptionConfig = {
            action: "childrenUpdate",
            streamType: "container",
            level: "workspace",
            levelId: id,
            callback: wrappedCallback
        };

        const unsubscribe = await getData(this).controller.processLocalSubscription(config, id);
        return unsubscribe;
    }
}
