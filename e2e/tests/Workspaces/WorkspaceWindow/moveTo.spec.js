describe.skip("moveTo() Should", async () => {
    const windowConfig = {
        type: "window",
        appName: "dummyApp"
    };

    const threeContainersConfig = {
        children: [
            {
                type: "row",
                children: [
                    {
                        type: "column",
                        children: [
                            {
                                type: "row",
                                children: [

                                ]
                            }
                        ]
                    },
                    {
                        type: "column",
                        children: [
                            {
                                type: "group",
                                children: [
                                    windowConfig
                                ]
                            }
                        ]
                    },
                    {
                        type: "column",
                        children: [

                        ]
                    }
                ]
            }
        ]
    }

    const threeContainersConfigNewFrame = {
        children: [
            {
                type: "row",
                children: [
                    {
                        type: "column",
                        children: [
                            {
                                type: "row",
                                children: [

                                ]
                            }
                        ]
                    },
                    {
                        type: "column",
                        children: [
                            {
                                type: "group",
                                children: [
                                    windowConfig
                                ]
                            }
                        ]
                    },
                    {
                        type: "column",
                        children: [

                        ]
                    }
                ]
            }
        ],
        frame: {
            newFrame: true
        }
    }
    // BUG
    before(async () => {
        await Promise.all([glueReady, gtfReady]);
    });

    afterEach(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("move the window from one row to another when the target is a row in the same frame", async () => {
        const firstWorkspace = await glue.workspaces.createWorkspace(threeContainersConfig);
        const secondWorkspace = await glue.workspaces.createWorkspace(threeContainersConfig);

        const immediateChildren = firstWorkspace.getAllChildren();
        const firstRow = immediateChildren[0];
        const columnWithRow = firstRow.getAllChildren().find(c => c.getAllChildren().some(cc => cc.type === "row"));
        const rowInColumn = columnWithRow.getAllChildren()[0];
        await rowInColumn.addWindow(windowConfig);

        await firstWorkspace.refreshReference();

        const newlyAddedWindow = firstWorkspace.getAllWindows().find(w => w.myParent && w.myParent.type === "row");

        const immediateChildrenSecond = secondWorkspace.getAllChildren();
        const firstRowSecond = immediateChildrenSecond[0];
        const columnWithRowSecond = firstRowSecond.getAllChildren().find(c => c.getAllChildren().some(cc => cc.type === "row"));
        const rowInColumnSecond = columnWithRowSecond.getAllChildren()[0];

        await newlyAddedWindow.moveTo(rowInColumnSecond);

        await firstWorkspace.refreshReference();
        await secondWorkspace.refreshReference();

        const firstWindows = firstWorkspace.getAllWindows();
        const secondWindows = secondWorkspace.getAllWindows();

        expect(firstWindows.length).to.eql(1);
        expect(secondWindows.length).to.eql(2);
    });

    it("move the window from one column to another when the target is a column in the same frame", async () => {
        const firstWorkspace = await glue.workspaces.createWorkspace(threeContainersConfig);
        const secondWorkspace = await glue.workspaces.createWorkspace(threeContainersConfig);

        const immediateChildren = firstWorkspace.getAllChildren();
        const firstRow = immediateChildren[0];
        const columnWithNoChildren = firstRow.getAllChildren().find(c => c.getAllChildren().length === 0);
        await columnWithNoChildren.addWindow(windowConfig);

        await firstWorkspace.refreshReference();

        const newlyAddedWindow = firstWorkspace.getAllWindows().find(w => w.myParent && w.myParent.type === "column");

        const immediateChildrenSecond = secondWorkspace.getAllChildren();
        const firstRowSecond = immediateChildrenSecond[0];
        const columnWithNoChildrenSecond = firstRowSecond.getAllChildren().find(c => c.getAllChildren().length === 0);

        await newlyAddedWindow.moveTo(columnWithNoChildrenSecond);

        // await firstWorkspace.refreshReference();
        // await secondWorkspace.refreshReference();

        // const firstWindows = firstWorkspace.getAllWindows();
        // const secondWindows = secondWorkspace.getAllWindows();

        // expect(firstWindows.length).to.eql(1);
        // expect(secondWindows.length).to.eql(2);
    });

    it("move the window from one group to another when the target is a group in the same frame", async () => {
        const firstWorkspace = await glue.workspaces.createWorkspace(threeContainersConfig);
        const secondWorkspace = await glue.workspaces.createWorkspace(threeContainersConfig);

        const immediateChildren = firstWorkspace.getAllChildren();
        const firstRow = immediateChildren[0];
        const columnWithGroup = firstRow.getAllChildren().find(c => c.getAllChildren().some(cc => cc.type === "group"));
        const groupInColumn = columnWithGroup.getAllChildren()[0];
        await groupInColumn.addWindow(windowConfig);

        await firstWorkspace.refreshReference();

        const newlyAddedWindow = firstWorkspace.getAllWindows().find(w => w.myParent && w.myParent.type === "group");

        const immediateChildrenSecond = secondWorkspace.getAllChildren();
        const firstRowSecond = immediateChildrenSecond[0];
        const columnWithGroupSecond = firstRowSecond.getAllChildren().find(c => c.getAllChildren().some(cc => cc.type === "group"));
        const groupInColumnSecond = columnWithGroupSecond.getAllChildren()[0];

        await newlyAddedWindow.moveTo(groupInColumnSecond);

        await firstWorkspace.refreshReference();
        await secondWorkspace.refreshReference();

        const firstWindows = firstWorkspace.getAllWindows();
        const secondWindows = secondWorkspace.getAllWindows();

        expect(firstWindows.length).to.eql(1);
        expect(secondWindows.length).to.eql(2);
    });

    it("move the window from one row to another when the target is a row in different frames", async () => {
        const firstWorkspace = await glue.workspaces.createWorkspace(threeContainersConfigNewFrame);
        const secondWorkspace = await glue.workspaces.createWorkspace(threeContainersConfigNewFrame);

        const immediateChildren = firstWorkspace.getAllChildren();
        const firstRow = immediateChildren[0];
        const columnWithRow = firstRow.getAllChildren().find(c => c.getAllChildren().some(cc => cc.type === "row"));
        const rowInColumn = columnWithRow.getAllChildren()[0];
        await rowInColumn.addWindow(windowConfig);

        await firstWorkspace.refreshReference();

        const newlyAddedWindow = firstWorkspace.getAllWindows().find(w => w.myParent && w.myParent.type === "row");

        const immediateChildrenSecond = secondWorkspace.getAllChildren();
        const firstRowSecond = immediateChildrenSecond[0];
        const columnWithRowSecond = firstRowSecond.getAllChildren().find(c => c.getAllChildren().some(cc => cc.type === "row"));
        const rowInColumnSecond = columnWithRowSecond.getAllChildren()[0];

        await newlyAddedWindow.moveTo(rowInColumnSecond);

        await firstWorkspace.refreshReference();
        await secondWorkspace.refreshReference();

        const firstWindows = firstWorkspace.getAllWindows();
        const secondWindows = secondWorkspace.getAllWindows();

        expect(firstWindows.length).to.eql(1);
        expect(secondWindows.length).to.eql(2);
    });

    it("move the window from one column to another when the target is a column in different frames", async () => {
        const firstWorkspace = await glue.workspaces.createWorkspace(threeContainersConfigNewFrame);
        const secondWorkspace = await glue.workspaces.createWorkspace(threeContainersConfigNewFrame);

        const immediateChildren = firstWorkspace.getAllChildren();
        const firstRow = immediateChildren[0];
        const columnWithNoChildren = firstRow.getAllChildren().find(c => c.getAllChildren().length === 0);
        await columnWithNoChildren.addWindow(windowConfig);

        await firstWorkspace.refreshReference();

        const newlyAddedWindow = firstWorkspace.getAllWindows().find(w => w.myParent && w.myParent.type === "column");

        const immediateChildrenSecond = secondWorkspace.getAllChildren();
        const firstRowSecond = immediateChildrenSecond[0];
        const columnWithNoChildrenSecond = firstRowSecond.getAllChildren().find(c => c.getAllChildren().length === 0);

        await newlyAddedWindow.moveTo(columnWithNoChildrenSecond);

        await firstWorkspace.refreshReference();
        await secondWorkspace.refreshReference();

        const firstWindows = firstWorkspace.getAllWindows();
        const secondWindows = secondWorkspace.getAllWindows();

        expect(firstWindows.length).to.eql(1);
        expect(secondWindows.length).to.eql(2);
    });

    it("move the window from one group to another when the target is a group in different frames", async () => {
        const firstWorkspace = await glue.workspaces.createWorkspace(threeContainersConfigNewFrame);
        const secondWorkspace = await glue.workspaces.createWorkspace(threeContainersConfigNewFrame);

        const immediateChildren = firstWorkspace.getAllChildren();
        const firstRow = immediateChildren[0];
        const columnWithGroup = firstRow.getAllChildren().find(c => c.getAllChildren().some(cc => cc.type === "group"));
        const groupInColumn = columnWithGroup.getAllChildren()[0];
        await groupInColumn.addWindow(windowConfig);

        await firstWorkspace.refreshReference();

        const newlyAddedWindow = firstWorkspace.getAllWindows().find(w => w.myParent && w.myParent.type === "group");

        const immediateChildrenSecond = secondWorkspace.getAllChildren();
        const firstRowSecond = immediateChildrenSecond[0];
        const columnWithGroupSecond = firstRowSecond.getAllChildren().find(c => c.getAllChildren().some(cc => cc.type === "group"));
        const groupInColumnSecond = columnWithGroupSecond.getAllChildren()[0];

        await newlyAddedWindow.moveTo(groupInColumnSecond);

        await firstWorkspace.refreshReference();
        await secondWorkspace.refreshReference();

        const firstWindows = firstWorkspace.getAllWindows();
        const secondWindows = secondWorkspace.getAllWindows();

        expect(firstWindows.length).to.eql(1);
        expect(secondWindows.length).to.eql(2);
    });

    it.skip("move the window from one row to another when the target is a row in the same workspace", () => {
        // TODO
    });

    it.skip("move the window from one column to another when the target is a column in the same workspace", () => {
        // TODO
    });

    it.skip("move the window from one group to another when the target is a group in the same workspace", () => {
        // TODO
    });
});