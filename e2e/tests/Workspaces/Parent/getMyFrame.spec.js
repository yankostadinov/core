describe.skip("getMyFrame() Should", () => {
    const config = {
        children: [
            {
                type: "row",
                children: [
                    {
                        type: "column",
                        children: [
                            {
                                type: "row",
                                children: []
                            }
                        ]
                    },
                    {
                        type: "column",
                        children: [
                            {
                                type: "group",
                                children: [
                                    {
                                        type: "window",
                                        appName: "dummyApp"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "column",
                        children: []
                    }
                ]
            }
        ],
        frame: {
            newFrame: true
        }
    };

    let workspace = undefined;
    // BUG
    before(async () => {
        await Promise.all([glueReady, gtfReady]);
        await glue.workspaces.createWorkspace(config);
        workspace = await glue.workspaces.createWorkspace(config);
        await glue.workspaces.createWorkspace(config);
    });

    after(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("return the correct frame when the parent is a row", () => {
        const row = workspace.getAllParents().find(p => p.type === "row");
        const frame = row.getMyFrame();

        expect(frame.id).to.eql(workspace.frameId);
    });

    it("return the correct frame when the parent is a column", () => {
        const column = workspace.getAllParents().find(p => p.type === "column");
        const frame = column.getMyFrame();

        expect(frame.id).to.eql(workspace.frameId);
    });

    it("return the correct frame when the parent is a group", () => {
        const group = workspace.getAllParents().find(p => p.type === "group");
        const frame = group.getMyFrame();

        expect(frame.id).to.eql(workspace.frameId);
    });
});