describe("getAllChildren() Should", () => {
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

    it("return the immediate children when parent is a group", () => {
        const groupUnderTest = workspace.getParent(p => p.type == "group");
        const allChildren = groupUnderTest.getAllChildren();

        expect(allChildren.length).to.eql(2);
    });

    it("return the immediate children when the parent is a row", () => {
        const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
        const allChildren = rowUnderTest.getAllChildren();

        expect(allChildren.length).to.eql(3);
    });

    it("return the immediate children when the parent is a column", () => {
        const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
        const allChildren = columnUnderTest.getAllChildren();

        expect(allChildren.length).to.eql(2);
    });

    it("return the correct children when the parent is a group", () => {
        const groupUnderTest = workspace.getParent(p => p.type == "group");
        const allChildren = groupUnderTest.getAllChildren();

        const areAllChildrenWindows = allChildren.every(c => c.type === "window");

        expect(areAllChildrenWindows).to.be.true;
    });

    it("return the correct children when the parent is a row", () => {
        const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
        const allChildren = rowUnderTest.getAllChildren();

        const areAllChildrenColumns = allChildren.every(c => c.type === "column");

        expect(areAllChildrenColumns).to.be.true;
    });

    it("return the correct children when the parent is a column", () => {
        const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
        const allChildren = columnUnderTest.getAllChildren();

        const areAllChildrenWindows = allChildren.every(c => c.type === "window");

        expect(areAllChildrenWindows).to.be.true;
    });

    describe("", () => {
        before(async () => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        it("return the immediate children when parent is a group and the workspace is not focused", () => {
            const groupUnderTest = workspace.getParent(p => p.type == "group");
            const allChildren = groupUnderTest.getAllChildren();

            expect(allChildren.length).to.eql(2);
        });

        it("return the immediate children when the parent is a row and the workspace is not focused", () => {
            const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
            const allChildren = rowUnderTest.getAllChildren();

            expect(allChildren.length).to.eql(3);
        });

        it("return the immediate children when the parent is a column and the workspace is not focused", () => {
            const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
            const allChildren = columnUnderTest.getAllChildren();

            expect(allChildren.length).to.eql(2);
        });

        it("return the correct children when the parent is a group and the workspace is not focused", () => {
            const groupUnderTest = workspace.getParent(p => p.type == "group");
            const allChildren = groupUnderTest.getAllChildren();

            const areAllChildrenWindows = allChildren.every(c => c.type === "window");

            expect(areAllChildrenWindows).to.be.true;
        });

        it("return the correct children when the parent is a row and the workspace is not focused", () => {
            const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
            const allChildren = rowUnderTest.getAllChildren();

            const areAllChildrenColumns = allChildren.every(c => c.type === "column");

            expect(areAllChildrenColumns).to.be.true;
        });

        it("return the correct children when the parent is a column and the workspace is not focused", () => {
            const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
            const allChildren = columnUnderTest.getAllChildren();

            const areAllChildrenWindows = allChildren.every(c => c.type === "window");

            expect(areAllChildrenWindows).to.be.true;
        });
    });

    Array.from([null, 42, "42", {}, []]).forEach((input) => {
        it(`throw an error when the input is ${JSON.stringify(input)} and the parent is a group`, (done) => {
            try {
                const groupUnderTest = workspace.getParent(p => p.type == "group");

                groupUnderTest.getAllChildren(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });

        it(`throw an error when the input is ${JSON.stringify(input)} and the parent is a row`, (done) => {
            try {
                const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);

                rowUnderTest.getAllChildren(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });

        it(`throw an error when the input is ${JSON.stringify(input)} and the parent is a column`, (done) => {
            try {
                const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);

                columnUnderTest.getAllChildren(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });
    });


})