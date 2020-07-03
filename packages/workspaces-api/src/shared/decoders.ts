import { Decoder, object, boolean, string, optional, array, oneOf, constant, lazy, number, anyJson, intersection } from "decoder-validate";
import { IsWindowInSwimlaneResult, WorkspaceSnapshotResult, ChildSnapshotResult, WorkspaceConfigResult, FrameSummaryResult, WorkspaceCreateConfigProtocol, GetFrameSummaryConfig, WorkspaceSummaryResult, LayoutSummariesResult, LayoutSummary, OpenWorkspaceConfig, FrameSummariesResult, WorkspaceSummariesResult, ExportedLayoutsResult, DeleteLayoutConfig, SimpleItemConfig, ResizeItemConfig, MoveFrameConfig, FrameSnapshotResult, BaseChildSnapshotConfig, ParentSnapshotConfig, SwimlaneWindowSnapshotConfig, SimpleWindowOperationSuccessResult, SetItemTitleConfig, MoveWindowConfig, AddWindowConfig, AddContainerConfig, AddItemResult, BundleConfig, WorkspaceStreamData, FrameStreamData, ContainerStreamData, ContainerSummaryResult, WindowStreamData } from "../types/protocol";
import { StreamType, StreamAction } from "../types/subscription";
import { WorkspaceCreateConfig, ParentDefinition, WorkspaceWindowDefinition, NewFrameConfig, RestoreType, RestoreWorkspaceConfig, WorkspaceDefinition, BuilderConfig, WorkspaceSummary, ParentSummary, WorkspaceWindowSummary, CustomWorkspaceSnapshot, WorkspaceLayout, ResizeConfig, MoveConfig, WorkspaceLayoutSaveConfig } from "../../workspaces";

export const nonEmptyStringDecoder: Decoder<string> = string().where((s) => s.length > 0, "Expected a non-empty string");
export const nonNegativeNumberDecoder: Decoder<number> = number().where((num) => num >= 0, "Expected a non-negative number");

export const isWindowInSwimlaneResultDecoder: Decoder<IsWindowInSwimlaneResult> = object({
    inWorkspace: boolean()
});

export const allParentDecoder: Decoder<"workspace" | "row" | "column" | "group"> = oneOf<"workspace" | "row" | "column" | "group">(
    constant("workspace"),
    constant("row"),
    constant("column"),
    constant("group")
);

export const subParentDecoder: Decoder<"row" | "column" | "group"> = oneOf<"row" | "column" | "group">(
    constant("row"),
    constant("column"),
    constant("group")
);

export const checkThrowCallback = (callback: unknown, allowUndefined?: boolean): void => {
    const argumentType = typeof callback;

    if (allowUndefined && argumentType !== "function" && argumentType !== "undefined") {
        throw new Error(`Provided argument must be either undefined or of type function, provided: ${argumentType}`);
    }

    if (!allowUndefined && argumentType !== "function") {
        throw new Error(`Provided argument must be of type function, provided: ${argumentType}`);
    }
};

export const workspaceBuilderCreateConfigDecoder: Decoder<WorkspaceCreateConfig> = optional(object({
    saveLayout: optional(boolean())
}));

export const deleteLayoutConfigDecoder: Decoder<DeleteLayoutConfig> = object({
    name: nonEmptyStringDecoder
});


export const swimlaneWindowDefinitionDecoder: Decoder<WorkspaceWindowDefinition> = object({
    type: optional(constant("window")),
    appName: optional(nonEmptyStringDecoder),
    windowId: optional(nonEmptyStringDecoder)
});

export const parentDefinitionDecoder: Decoder<ParentDefinition> = optional(object({
    type: optional(subParentDecoder),
    children: optional(
        lazy(() => array(
            oneOf<WorkspaceWindowDefinition | ParentDefinition>(
                swimlaneWindowDefinitionDecoder,
                parentDefinitionDecoder
            )
        ))
    )
}));

export const strictParentDefinitionDecoder: Decoder<ParentDefinition> = object({
    type: subParentDecoder,
    children: optional(
        lazy(() => array(
            oneOf<WorkspaceWindowDefinition | ParentDefinition>(
                swimlaneWindowDefinitionDecoder,
                parentDefinitionDecoder
            )
        ))
    )
});

export const stateDecoder: Decoder<"maximized" | "normal"> = oneOf<"maximized" | "normal">(
    (string().where((s) => s.toLowerCase() === "maximized", "Expected a case insensitive variation of 'maximized'") as Decoder<"maximized">),
    (string().where((s) => s.toLowerCase() === "normal", "Expected a case insensitive variation of 'normal'") as Decoder<"normal">)
);

export const newFrameConfigDecoder: Decoder<NewFrameConfig> = object({
    bounds: optional(object({
        left: optional(number()),
        top: optional(number()),
        width: optional(nonNegativeNumberDecoder),
        height: optional(nonNegativeNumberDecoder)
    }))
});

export const restoreTypeDecoder: Decoder<RestoreType> = oneOf<"direct" | "delayed" | "lazy">(
    constant("direct"),
    constant("delayed"),
    constant("lazy")
);

export const restoreWorkspaceConfigDecoder: Decoder<RestoreWorkspaceConfig> = optional(object({
    app: optional(nonEmptyStringDecoder),
    context: optional(anyJson()),
    restoreType: optional(restoreTypeDecoder),
    title: optional(nonEmptyStringDecoder),
    reuseWorkspaceId: optional(nonEmptyStringDecoder),
    frameId: optional(nonEmptyStringDecoder),
    lockdown: optional(boolean()),
    activateFrame: optional(boolean()),
    newFrame: optional(oneOf<NewFrameConfig | boolean>(
        newFrameConfigDecoder,
        boolean()
    )),
    inMemoryLayout: optional(boolean())
}));

export const openWorkspaceConfigDecoder: Decoder<OpenWorkspaceConfig> = object({
    name: nonEmptyStringDecoder,
    restoreOptions: optional(restoreWorkspaceConfigDecoder)
});

export const workspaceDefinitionDecoder: Decoder<WorkspaceDefinition> = object({
    children: optional(array(oneOf<WorkspaceWindowDefinition | ParentDefinition>(
        swimlaneWindowDefinitionDecoder,
        parentDefinitionDecoder
    ))),
    context: optional(anyJson()),
    config: optional(object({
        title: optional(nonEmptyStringDecoder),
        position: optional(nonNegativeNumberDecoder),
        isFocused: optional(boolean())
    })),
    frame: optional(object({
        reuseFrameId: optional(nonEmptyStringDecoder),
        newFrame: optional(oneOf<boolean | NewFrameConfig>(
            boolean(),
            newFrameConfigDecoder
        ))
    }))
});

export const builderConfigDecoder: Decoder<BuilderConfig> = object({
    type: allParentDecoder,
    definition: oneOf<WorkspaceDefinition | ParentDefinition>(
        workspaceDefinitionDecoder,
        parentDefinitionDecoder
    )
});

export const workspaceCreateConfigDecoder: Decoder<WorkspaceCreateConfigProtocol> = intersection(
    workspaceDefinitionDecoder,
    object({
        saveConfig: optional(object({
            saveLayout: optional(boolean())
        }))
    })
);

export const getFrameSummaryConfigDecoder: Decoder<GetFrameSummaryConfig> = object({
    itemId: nonEmptyStringDecoder
});

export const frameSummaryDecoder: Decoder<FrameSummaryResult> = object({
    id: nonEmptyStringDecoder
});

export const workspaceSummaryDecoder: Decoder<WorkspaceSummary> = object({
    id: nonEmptyStringDecoder,
    frameId: nonEmptyStringDecoder,
    positionIndex: number(),
    title: nonEmptyStringDecoder,
    focused: boolean()
});

export const containerSummaryDecoder: Decoder<ParentSummary> = object({
    type: subParentDecoder,
    id: nonEmptyStringDecoder,
    frameId: nonEmptyStringDecoder,
    workspaceId: nonEmptyStringDecoder,
    positionIndex: number()
});

export const swimlaneWindowSummaryDecoder: Decoder<WorkspaceWindowSummary> = object({
    id: optional(nonEmptyStringDecoder),
    frameId: nonEmptyStringDecoder,
    workspaceId: nonEmptyStringDecoder,
    positionIndex: number(),
    isMaximized: boolean(),
    title: optional(string()),
    isLoaded: boolean(),
    focused: boolean(),
    type: constant("window")
});

export const streamRequestArgumentsDecoder: Decoder<{ type: StreamType; branch: string }> = object({
    type: oneOf<"frame" | "workspace" | "container" | "window">(
        constant("frame"),
        constant("workspace"),
        constant("container"),
        constant("window")
    ),
    branch: nonEmptyStringDecoder
});

export const streamActionDecoder: Decoder<StreamAction> = oneOf<"opened" | "closing" | "closed" | "focus" | "added" | "loaded" | "removed" | "childrenUpdate" | "containerChange">(
    constant("opened"),
    constant("closing"),
    constant("closed"),
    constant("focus"),
    constant("added"),
    constant("loaded"),
    constant("removed"),
    constant("childrenUpdate"),
    constant("containerChange")
);

export const workspaceConfigResultDecoder: Decoder<WorkspaceConfigResult> = object({
    frameId: nonEmptyStringDecoder,
    title: nonEmptyStringDecoder,
    positionIndex: nonNegativeNumberDecoder,
    name: nonEmptyStringDecoder
});

export const baseChildSnapshotConfigDecoder: Decoder<BaseChildSnapshotConfig> = object({
    frameId: nonEmptyStringDecoder,
    workspaceId: nonEmptyStringDecoder,
    positionIndex: nonNegativeNumberDecoder
});

export const parentSnapshotConfigDecoder: Decoder<ParentSnapshotConfig> = anyJson();

export const swimlaneWindowSnapshotConfigDecoder: Decoder<SwimlaneWindowSnapshotConfig> = intersection(
    baseChildSnapshotConfigDecoder,
    object({
        windowId: optional(nonEmptyStringDecoder),
        isMaximized: boolean(),
        isLoaded: boolean(),
        isFocused: boolean(),
        title: optional(string())
    })
);

export const childSnapshotResultDecoder: Decoder<ChildSnapshotResult> = object({
    id: nonEmptyStringDecoder,
    config: oneOf<ParentSnapshotConfig | SwimlaneWindowSnapshotConfig>(
        parentSnapshotConfigDecoder,
        swimlaneWindowSnapshotConfigDecoder
    ),
    children: optional(lazy(() => array(childSnapshotResultDecoder))),
    type: oneOf<"window" | "row" | "column" | "group">(
        constant("window"),
        constant("row"),
        constant("column"),
        constant("group")
    )
});

export const workspaceSnapshotResultDecoder: Decoder<WorkspaceSnapshotResult> = object({
    id: nonEmptyStringDecoder,
    config: workspaceConfigResultDecoder,
    children: array(childSnapshotResultDecoder),
    frameSummary: frameSummaryDecoder
});

export const customWorkspaceChildSnapshotDecoder: Decoder<ChildSnapshotResult> = object({
    id: optional(nonEmptyStringDecoder),
    config: oneOf<ParentSnapshotConfig | SwimlaneWindowSnapshotConfig>(
        parentSnapshotConfigDecoder,
        swimlaneWindowSnapshotConfigDecoder
    ),
    children: optional(lazy(() => array(customWorkspaceChildSnapshotDecoder))),
    type: oneOf<"window" | "row" | "column" | "group">(
        constant("window"),
        constant("row"),
        constant("column"),
        constant("group")
    )
});

export const customWorkspaceSnapshotDecoder: Decoder<CustomWorkspaceSnapshot> = object({
    id: optional(nonEmptyStringDecoder),
    children: array(customWorkspaceChildSnapshotDecoder),
});

export const swimlaneLayoutDecoder: Decoder<WorkspaceLayout> = object({
    name: nonEmptyStringDecoder,
    layout: optional(customWorkspaceSnapshotDecoder),
    workspaceId: optional(nonEmptyStringDecoder)
});

export const exportedLayoutsResultDecoder: Decoder<ExportedLayoutsResult> = object({
    layouts: array(swimlaneLayoutDecoder)
});

export const frameSummaryResultDecoder: Decoder<FrameSummaryResult> = object({
    id: nonEmptyStringDecoder,
});

export const frameSummariesResultDecoder: Decoder<FrameSummariesResult> = object({
    summaries: array(frameSummaryResultDecoder)
});

export const workspaceSummaryResultDecoder: Decoder<WorkspaceSummaryResult> = object({
    id: nonEmptyStringDecoder,
    config: workspaceConfigResultDecoder
});

export const workspaceSummariesResultDecoder: Decoder<WorkspaceSummariesResult> = object({
    summaries: array(workspaceSummaryResultDecoder)
});

export const frameSnapshotResultDecoder: Decoder<FrameSnapshotResult> = object({
    id: nonEmptyStringDecoder,
    config: anyJson(),
    workspaces: array(workspaceSnapshotResultDecoder)
});

export const layoutSummaryDecoder: Decoder<LayoutSummary> = object({
    name: nonEmptyStringDecoder
});

export const layoutSummariesDecoder: Decoder<LayoutSummariesResult> = object({
    summaries: array(layoutSummaryDecoder)
});

export const simpleWindowOperationSuccessResultDecoder: Decoder<SimpleWindowOperationSuccessResult> = object({
    windowId: nonEmptyStringDecoder
});

export const voidResultDecoder: Decoder<{}> = anyJson();

export const resizeConfigDecoder: Decoder<ResizeConfig> = object({
    width: optional(nonNegativeNumberDecoder),
    height: optional(nonNegativeNumberDecoder),
    relative: optional(boolean())
});

export const moveConfigDecoder: Decoder<MoveConfig> = object({
    top: optional(number()),
    left: optional(number()),
    relative: optional(boolean())
});

export const simpleItemConfigDecoder: Decoder<SimpleItemConfig> = object({
    itemId: nonEmptyStringDecoder
});

export const setItemTitleConfigDecoder: Decoder<SetItemTitleConfig> = object({
    itemId: nonEmptyStringDecoder,
    title: nonEmptyStringDecoder
});

export const moveWindowConfigDecoder: Decoder<MoveWindowConfig> = object({
    itemId: nonEmptyStringDecoder,
    containerId: nonEmptyStringDecoder
});

export const resizeItemConfigDecoder: Decoder<ResizeItemConfig> = intersection(
    simpleItemConfigDecoder,
    resizeConfigDecoder
);

export const moveFrameConfigDecoder: Decoder<MoveFrameConfig> = intersection(
    simpleItemConfigDecoder,
    moveConfigDecoder
);

export const simpleParentDecoder: Decoder<{ id: string; type: "row" | "column" | "group" }> = object({
    id: nonEmptyStringDecoder,
    type: subParentDecoder
});

export const addWindowConfigDecoder: Decoder<AddWindowConfig> = object({
    definition: swimlaneWindowDefinitionDecoder,
    parentId: nonEmptyStringDecoder,
    parentType: allParentDecoder
});

export const addContainerConfigDecoder: Decoder<AddContainerConfig> = object({
    definition: strictParentDefinitionDecoder,
    parentId: nonEmptyStringDecoder,
    parentType: allParentDecoder
});

export const addItemResultDecoder: Decoder<AddItemResult> = object({
    itemId: nonEmptyStringDecoder,
    windowId: optional(nonEmptyStringDecoder)
});

export const bundleConfigDecoder: Decoder<BundleConfig> = object({
    type: oneOf<"row" | "column">(
        constant("row"),
        constant("column")
    ),
    workspaceId: nonEmptyStringDecoder
});

export const containerSummaryResultDecoder: Decoder<ContainerSummaryResult> = object({
    itemId: nonEmptyStringDecoder,
    config: parentSnapshotConfigDecoder
});

export const frameStreamDataDecoder: Decoder<FrameStreamData> = object({
    frameSummary: frameSummaryDecoder
});

export const workspaceStreamDataDecoder: Decoder<WorkspaceStreamData> = object({
    workspaceSummary: workspaceSummaryResultDecoder,
    frameSummary: frameSummaryDecoder
});

export const containerStreamDataDecoder: Decoder<ContainerStreamData> = object({
    containerSummary: containerSummaryResultDecoder
});

export const windowStreamDataDecoder: Decoder<WindowStreamData> = object({
    windowSummary: object({
        itemId: nonEmptyStringDecoder,
        parentId: nonEmptyStringDecoder,
        config: swimlaneWindowSnapshotConfigDecoder
    })
});

export const workspaceLayoutSaveConfigDecoder: Decoder<WorkspaceLayoutSaveConfig> = object({
    name: nonEmptyStringDecoder,
    workspaceId: nonEmptyStringDecoder
});
