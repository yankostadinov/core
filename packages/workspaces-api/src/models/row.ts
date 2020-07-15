import { Base } from "./base/base";
import { Row as RowAPI, WorkspaceChild, Workspace, WorkspaceParent, Frame, WorkspaceWindowDefinition, WorkspaceWindow, ParentDefinition, Group, Column } from "../../workspaces.d";

interface PrivateData {
    base: Base;
}

const privateData = new WeakMap<Row, PrivateData>();

const getBase = (model: Row): Base => {
    return privateData.get(model).base;
};

export class Row implements RowAPI {

    constructor(base: Base) {
        privateData.set(this, { base });
    }

    public get type(): "row" {
        return "row";
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
        return getBase(this).addWindow(this, definition, "row");
    }

    public async addGroup(definition?: ParentDefinition): Promise<Group> {
        if (definition?.type && definition.type !== "group") {
            throw new Error(`Expected a group definition, but received ${definition.type}`);
        }
        return getBase(this).addParent<Group>(this, "group", "row", definition);
    }

    public async addColumn(definition?: ParentDefinition): Promise<Column> {
        if (definition?.type && definition.type !== "column") {
            throw new Error(`Expected a column definition, but received ${definition.type}`);
        }
        return getBase(this).addParent<Column>(this, "column", "row", definition);
    }

    public async addRow(): Promise<Row> {
        throw new Error("Adding rows as row children is not supported");
    }

    public removeChild(predicate: (child: WorkspaceChild) => boolean): Promise<void> {
        // tslint:disable-next-line: no-console
        console.log("in row close will remove child");
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
