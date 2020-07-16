/* eslint-disable @typescript-eslint/no-use-before-define */

import { Decoder, object, constant, optional, anyJson, array, oneOf, lazy } from "decoder-validate";
import { WindowLayoutItem, GroupLayoutItem, ColumnLayoutItem, RowLayoutItem, WorkspaceComponent } from "@glue42/workspaces-api";
import { nonEmptyStringDecoder } from ".";

export const windowLayoutItemDecoder: Decoder<WindowLayoutItem> = object({
    type: constant("window"),
    config: object({
        appName: nonEmptyStringDecoder,
        url: optional(nonEmptyStringDecoder)
    })
});

export const groupLayoutItemDecoder: Decoder<GroupLayoutItem> = object({
    type: constant("group"),
    config: anyJson(),
    children: array(oneOf<WindowLayoutItem>(
        windowLayoutItemDecoder
    ))
});

export const columnLayoutItemDecoder: Decoder<ColumnLayoutItem> = object({
    type: constant("column"),
    config: anyJson(),
    children: array(oneOf<RowLayoutItem | ColumnLayoutItem | GroupLayoutItem | WindowLayoutItem>(
        groupLayoutItemDecoder,
        windowLayoutItemDecoder,
        lazy(() => columnLayoutItemDecoder),
        lazy(() => rowLayoutItemDecoder)
    ))
});

export const rowLayoutItemDecoder: Decoder<RowLayoutItem> = object({
    type: constant("row"),
    config: anyJson(),
    children: array(oneOf<RowLayoutItem | ColumnLayoutItem | GroupLayoutItem | WindowLayoutItem>(
        columnLayoutItemDecoder,
        groupLayoutItemDecoder,
        windowLayoutItemDecoder,
        lazy(() => rowLayoutItemDecoder)
    ))
});

export const workspaceComponentDecoder: Decoder<WorkspaceComponent> = object({
    type: constant("Workspace"),
    state: object({
        config: anyJson(),
        children: array(oneOf<RowLayoutItem | ColumnLayoutItem | GroupLayoutItem | WindowLayoutItem>(
            rowLayoutItemDecoder,
            columnLayoutItemDecoder,
            groupLayoutItemDecoder,
            windowLayoutItemDecoder
        ))
    })
});
