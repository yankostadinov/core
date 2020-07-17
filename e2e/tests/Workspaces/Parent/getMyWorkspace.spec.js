describe("getMyWorkspace() Should", () => {
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

    it("return the correct workspace when the parent is a row", () => {
        const row = workspace.getAllParents().find(p => p.type === "row");
        const resultWorkspace = row.getMyWorkspace();

        expect(resultWorkspace.id).to.eql(workspace.id);
    });

    it("return the correct workspace when the parent is a column", () => {
        const column = workspace.getAllParents().find(p => p.type === "column");
        const resultWorkspace = column.getMyWorkspace();

        expect(resultWorkspace.id).to.eql(workspace.id);
    });

    it("return the correct workspace when the parent is a group", () => {
        const group = workspace.getAllParents().find(p => p.type === "group");
        const resultWorkspace = group.getMyWorkspace();

        expect(resultWorkspace.id).to.eql(workspace.id);
    });
});