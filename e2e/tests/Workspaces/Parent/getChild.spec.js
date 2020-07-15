describe("getChild() Should", () => {
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

    it("iterate over the immediate children when the parent is a group", () => {
        let iterations = 0;
        const groupUnderTest = workspace.getParent(p => p.type == "group");
        groupUnderTest.getChild((c) => {
            iterations += 1;
            return false;
        });

        expect(iterations).to.eql(2);
    });

    it("iterate over the immediate children when the parent is a row", () => {
        let iterations = 0;
        const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
        rowUnderTest.getChild((c) => {
            iterations += 1;
            return false;
        });

        expect(iterations).to.eql(3);
    });

    it("iterate over the immediate children when the parent is a column", () => {
        let iterations = 0;
        const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
        columnUnderTest.getChild((c) => {
            iterations += 1;
            return false;
        });

        expect(iterations).to.eql(2);
    });

    it("return the correct child when the parent is a group", () => {
        const groupUnderTest = workspace.getParent(p => p.type == "group");
        const allChildren = groupUnderTest.getAllChildren();

        const firstChild = allChildren[0];
        const secondChild = allChildren[1];

        const firstChildResult = groupUnderTest.getChild(c => c.id === firstChild.id);
        const secondChildResult = groupUnderTest.getChild(c => c.id === secondChild.id);

        expect(firstChildResult.id).to.eql(firstChild.id);
        expect(secondChildResult.id).to.eql(secondChild.id);
    });

    it("return the correct child when the parent is a row", () => {
        const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
        const allChildren = rowUnderTest.getAllChildren();

        const firstChild = allChildren[0];
        const secondChild = allChildren[1];
        const thirdChild = allChildren[2];

        const firstChildResult = rowUnderTest.getChild(c => c.id === firstChild.id);
        const secondChildResult = rowUnderTest.getChild(c => c.id === secondChild.id);
        const thirdChildResult = rowUnderTest.getChild(c => c.id === thirdChild.id);

        expect(firstChildResult.id).to.eql(firstChild.id);
        expect(secondChildResult.id).to.eql(secondChild.id);
        expect(thirdChildResult.id).to.eql(thirdChild.id);
    });

    it("return the correct child when the parent is a column", () => {
        const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
        const allChildren = columnUnderTest.getAllChildren();

        const firstChild = allChildren[0];
        const secondChild = allChildren[1];

        const firstChildResult = columnUnderTest.getChild(c => c.id === firstChild.id);
        const secondChildResult = columnUnderTest.getChild(c => c.id === secondChild.id);

        expect(firstChildResult.id).to.eql(firstChild.id);
        expect(secondChildResult.id).to.eql(secondChild.id);
    });

    it("return undefined when no child could be found when the parent is a group", () => {
        const groupUnderTest = workspace.getParent(p => p.type == "group");

        const child = groupUnderTest.getChild((c) => {
            return false;
        });

        expect(child).to.be.undefined;
    });

    it("return undefined when no child could be found when the parent is a row", () => {
        const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);

        const child = rowUnderTest.getChild((c) => {
            return false;
        });

        expect(child).to.be.undefined;
    });

    it("return undefined when no child could be found when the parent is a column", () => {
        const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);

        const child = columnUnderTest.getChild((c) => {
            return false;
        });

        expect(child).to.be.undefined;
    });

    describe("", () => {
        before(async () => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        it("iterate over the immediate children when the parent is a group and the workspace is not focused", () => {
            let iterations = 0;
            const groupUnderTest = workspace.getParent(p => p.type == "group");
            groupUnderTest.getChild((c) => {
                iterations += 1;
                return false;
            });

            expect(iterations).to.eql(2);
        });

        it("iterate over the immediate children when the parent is a row and the workspace is not focused", () => {
            let iterations = 0;
            const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
            rowUnderTest.getChild((c) => {
                iterations += 1;
                return false;
            });

            expect(iterations).to.eql(3);
        });

        it("iterate over the immediate children when the parent is a column and the workspace is not focused", () => {
            let iterations = 0;
            const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
            columnUnderTest.getChild((c) => {
                iterations += 1;
                return false;
            });

            expect(iterations).to.eql(2);
        });

        it("return the correct child when the parent is a group and the workspace is not focused", () => {
            const groupUnderTest = workspace.getParent(p => p.type == "group");
            const allChildren = groupUnderTest.getAllChildren();

            const firstChild = allChildren[0];
            const secondChild = allChildren[1];

            const firstChildResult = groupUnderTest.getChild(c => c.id === firstChild.id);
            const secondChildResult = groupUnderTest.getChild(c => c.id === secondChild.id);

            expect(firstChildResult.id).to.eql(firstChild.id);
            expect(secondChildResult.id).to.eql(secondChild.id);
        });

        it("return the correct child when the parent is a row and the workspace is not focused", () => {
            const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);
            const allChildren = rowUnderTest.getAllChildren();

            const firstChild = allChildren[0];
            const secondChild = allChildren[1];
            const thirdChild = allChildren[2];

            const firstChildResult = rowUnderTest.getChild(c => c.id === firstChild.id);
            const secondChildResult = rowUnderTest.getChild(c => c.id === secondChild.id);
            const thirdChildResult = rowUnderTest.getChild(c => c.id === thirdChild.id);

            expect(firstChildResult.id).to.eql(firstChild.id);
            expect(secondChildResult.id).to.eql(secondChild.id);
            expect(thirdChildResult.id).to.eql(thirdChild.id);
        });

        it("return the correct child when the parent is a column and the workspace is not focused", () => {
            const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);
            const allChildren = columnUnderTest.getAllChildren();

            const firstChild = allChildren[0];
            const secondChild = allChildren[1];

            const firstChildResult = columnUnderTest.getChild(c => c.id === firstChild.id);
            const secondChildResult = columnUnderTest.getChild(c => c.id === secondChild.id);

            expect(firstChildResult.id).to.eql(firstChild.id);
            expect(secondChildResult.id).to.eql(secondChild.id);
        });
    })

    Array.from([undefined, null, 42, "42", {}, []]).forEach((input) => {
        it(`throw an error when the input is ${JSON.stringify(input)} and the parent is a group`, (done) => {
            try {
                const groupUnderTest = workspace.getParent(p => p.type == "group");

                groupUnderTest.getChild(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });

        it(`throw an error when the input is ${JSON.stringify(input)} and the parent is a row`, (done) => {
            try {
                const rowUnderTest = workspace.getParent(p => p.type == "row" && p.getAllChildren().length === 3);

                rowUnderTest.getChild(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });

        it(`throw an error when the input is ${JSON.stringify(input)} and the parent is a column`, (done) => {
            try {
                const columnUnderTest = workspace.getParent(p => p.type == "column" && p.getAllChildren().length === 2);

                columnUnderTest.getChild(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });
    });


})