import { Base } from "./base/base";
import { Column as ColumnApi, WorkspaceChild, WorkspaceParent, Workspace, Frame, WorkspaceWindowDefinition, WorkspaceWindow, Group, ParentDefinition, Row } from "../../workspaces.d";

interface PrivateData {
    base: Base;
}

const privateData = new WeakMap<Column, PrivateData>();

const getBase = (model: Column): Base => {
    return privateData.get(model).base;
};

export class Column implements ColumnApi {

    constructor(base: Base) {
        privateData.set(this, { base });
    }

    public get type(): "column" {
        return "column";
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
        return getBase(this).addWindow(this, definition, "column");
    }

    public async addGroup(definition?: ParentDefinition): Promise<Group> {
        if (definition?.type && definition.type !== "group") {
            throw new Error(`Expected a group definition, but received ${definition.type}`);
        }
        return getBase(this).addParent<Group>(this, "group", "column", definition);
    }

    public async addColumn(definition?: ParentDefinition): Promise<Column> {
        throw new Error("Adding columns as column children is not supported");
        return getBase(this).addParent<Column>(this, "column", "column", definition);
    }

    public async addRow(definition?: ParentDefinition): Promise<Row> {
        if (definition?.type && definition.type !== "row") {
            throw new Error(`Expected a row definition, but received ${definition.type}`);
        }
        return getBase(this).addParent<Row>(this, "row", "column", definition);
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
