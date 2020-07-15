describe("getMyParent() Should", () => {
    const basicConfig = {
        children: [
            {
                type: "row",
                children: [
                    {
                        type: "column",
                        children: [
                            {
                                type: "window",
                                appName: "dummyApp"
                            },
                            {
                                type: "window",
                                appName: "dummyApp"
                            }
                        ]
                    },
                    {
                        type: "column",
                        children: [{
                            type: "group",
                            children: [
                                {
                                    type: "window",
                                    appName: "dummyApp"
                                },
                                {
                                    type: "window",
                                    appName: "dummyApp"
                                }
                            ]
                        }]
                    },
                    {
                        type: "column",
                        children: [
                            {
                                type: "row",
                                children: [
                                    {
                                        type: "window",
                                        appName: "dummyApp"
                                    },
                                    {
                                        type: "row",
                                        children: []
                                    }
                                ]
                            },
                        ]
                    }
                ],
            }
        ]
    }

    let workspace = undefined;

    before(async () => {
        await Promise.all([glueReady, gtfReady]);
        workspace = await glue.workspaces.createWorkspace(basicConfig);
    });

    after(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("return the parent when the target is a group", () => {
        const groupUnderTest = workspace.getParent(p => p.type == "group");
        const myParent = groupUnderTest.getMyParent();

        expect(myParent.type).to.eql("column");
    });

    it("return the parent when the target is a row", () => {
        const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
        const myParent = rowUnderTest.getMyParent();

        // to be a workspace
        expect(myParent.type).to.be.undefined;
    });

    it("return the parent when the target is a column", () => {
        const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
        const myParent = columnUnderTest.getMyParent();

        expect(myParent.type).to.eql("row");
    });

    describe("",()=>{
        before(async () => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        it("return the parent when the target is a group and workspace is not focused", () => {
            const groupUnderTest = workspace.getParent(p => p.type == "group");
            const myParent = groupUnderTest.getMyParent();
    
            expect(myParent.type).to.eql("column");
        });
    
        it("return the parent when the target is a row and workspace is not focused", () => {
            const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
            const myParent = rowUnderTest.getMyParent();
    
            // to be a workspace
            expect(myParent.type).to.be.undefined;
        });
    
        it("return the parent when the target is a column and workspace is not focused", () => {
            const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
            const myParent = columnUnderTest.getMyParent();
    
            expect(myParent.type).to.eql("row");
        });
    })
});