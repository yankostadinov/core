import { Base } from "./base/base";
import { Group as GroupAPI, WorkspaceChild, Workspace, WorkspaceParent, Frame, WorkspaceWindowDefinition, WorkspaceWindow, Column, Row } from "../../workspaces.d";

interface PrivateData {
    base: Base;
}

const privateData = new WeakMap<Group, PrivateData>();

const getBase = (model: Group): Base => {
    return privateData.get(model).base;
};

export class Group implements GroupAPI {

    constructor(base: Base) {
        privateData.set(this, { base });
    }

    public get type(): "group" {
        return "group";
    }

    public get id(): string {
        return getBase(this).getId(this);
    }

    public get frameId(): string {
        return getBase(this).getFrameId(this);
    }

    public get workspaceId(): string {
        return getBase(this).getWorkspaceId(this);
    }

    public get positionIndex(): number {
        return getBase(this).getPositionIndex(this);
    }

    public getChild(predicate: (child: WorkspaceChild) => boolean): WorkspaceChild {
        return getBase(this).getChild(this, predicate);
    }

    public getAllChildren(predicate?: (child: WorkspaceChild) => boolean): WorkspaceChild[] {
        return getBase(this).getAllChildren(this, predicate);
    }

    public getMyParent(): Workspace | WorkspaceParent {
        return getBase(this).getMyParent(this);
    }

    public getMyFrame(): Frame {
        return getBase(this).getMyFrame(this);
    }

    public getMyWorkspace(): Workspace {
        return getBase(this).getMyWorkspace(this);
    }

    public addWindow(definition: WorkspaceWindowDefinition): Promise<WorkspaceWindow> {
        return getBase(this).addWindow(this, definition, "group");
    }

    public async addGroup(): Promise<Group> {
        throw new Error("Adding groups as group child is not supported");
    }

    public async addColumn(): Promise<Column> {
        throw new Error("Adding columns as group child is not supported");
    }

    public async addRow(): Promise<Row> {
        throw new Error("Adding rows as group child is not supported");
    }

    public removeChild(predicate: (child: WorkspaceChild) => boolean): Promise<void> {
        return getBase(this).removeChild(this, predicate);
    }

    public maximize(): Promise<void> {
        return getBase(this).maximize(this);
    }

    public restore(): Promise<void> {
        return getBase(this).restore(this);
    }

    public close(): Promise<void> {
        return getBase(this).close(this);
    }

}
