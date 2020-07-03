import { ParentBuilder } from "./parentBuilder";
import { ChildDefinition, ChildBuilder } from "../types/builders";
import { parentDefinitionDecoder, swimlaneWindowDefinitionDecoder } from "../shared/decoders";
import { BuilderConfig, ParentDefinition, WorkspaceWindowDefinition } from "../../workspaces";
import { WorkspaceBuilder } from "./workspaceBuilder";

export class BaseBuilder {

    constructor(
        private readonly getBuilder: (config: BuilderConfig) => ParentBuilder | WorkspaceBuilder,
    ) { }

    public wrapChildren(children: ChildDefinition[]): ChildBuilder[] {
        return children.map((child) => {
            if (child.type === "window") {
                return child;
            }

            return this.getBuilder({ type: child.type, definition: child }) as ParentBuilder;
        });
    }

    public add(type: "row" | "column" | "group", children: ChildBuilder[], definition?: ParentDefinition): ParentBuilder {
        const validatedDefinition = parentDefinitionDecoder.runWithException(definition);

        const childBuilder = this.getBuilder({ type, definition: validatedDefinition }) as ParentBuilder;

        children.push(childBuilder);

        return childBuilder;
    }

    public addWindow(children: ChildBuilder[], definition: WorkspaceWindowDefinition): void {
        const validatedDefinition = swimlaneWindowDefinitionDecoder.runWithException(definition);

        validatedDefinition.type = "window";

        children.push(validatedDefinition);
    }

    public serializeChildren(children: ChildBuilder[]): ChildDefinition[] {
        return children.map((child) => {
            if (child instanceof ParentBuilder) {
                return child.serialize();
            } else {
                return child as WorkspaceWindowDefinition;
            }
        });
    }
}
