describe("getChild() Should", () => {
    const basicConfig = {
        children: [
            {
                type: "row",
                children: [
                    {
                        type: "column",
                        children: [{
                            type: "window",
                            appName: "dummyApp"
                        }]
                    },
                    {
                        type: "column",
                        children: [{
                            type: "group",
                            children: [{
                                type: "window",
                                appName: "dummyApp"
                            }]
                        }]
                    },
                    {
                        type: "column",
                        children: [{
                            type: "row",
                            children: [{
                                type: "window",
                                appName: "dummyApp"
                            }]
                        }]
                    },
                ]
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

    it("iterate over the immediate children", () => {
        let iterations = 0;
        workspace.getChild((c) => {
            iterations += 1;
            return false;
        });

        expect(iterations).to.eql(1);
    });

    it("return the correct child", () => {
        const row = workspace.getChild((c) => {
            return c.type === "row";
        });

        expect(row.type).to.eql("row");
    });

    it("return undefined when no child could be found", () => {
        const child = workspace.getChild((c) => {
            return false;
        });

        expect(child).to.be.undefined;
    });
    // Not focused workspace

    describe("", () => {
        beforeEach(async () => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        it("iterate over the immediate children when the workspace is not focused", () => {
            let iterations = 0;
            workspace.getChild((c) => {
                iterations += 1;
                return false;
            });

            expect(iterations).to.eql(1);
        });

        it("return the correct child when the workspace is not focused", () => {
            const row = workspace.getChild((c) => {
                return c.type === "row";
            });

            expect(row.type).to.eql("row");
        });
    });

    Array.from([undefined, null, 42, "42", {}, []]).forEach((input) => {
        it(`throw an error when the input is ${JSON.stringify(input)}`, (done) => {
            try {
                workspace.getChild(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });
    });
});