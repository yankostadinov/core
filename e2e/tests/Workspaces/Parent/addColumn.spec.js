describe("addColumn() Should", () => {
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
        ]
    };

    let workspace = undefined;
    before(() => {
        return Promise.all([glueReady, gtfReady]);
    });

    beforeEach(async () => {
        workspace = await glue.workspaces.createWorkspace(config);
    });

    afterEach(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("return the column when the parent is a row and is passed a column definition", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        const column = await row.addColumn({ type: "column", children: [] });

        expect(column).to.not.be.undefined;
        expect(column.constructor.name).to.eql("Column");
    });

    it("add the column when the parent is a row and is passed a column definition", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        await row.addColumn({ type: "column", children: [] });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the column when the parent is a row and is passed column as a type", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        const column = await row.addColumn({ type: "column" });

        expect(column).to.not.be.undefined;
        expect(column.constructor.name).to.eql("Column");
    });

    it("add the column when the parent is a row and is  passed column as a type", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        await row.addColumn({ type: "column" });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the column when the parent is a row and a children array is passed", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        const column = await row.addColumn({ children: [] });

        expect(column).to.not.be.undefined;
        expect(column.constructor.name).to.eql("Column");
    });

    it("add the column when the parent is a row and a children array is passed", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        await row.addColumn({ children: [] });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the column when the parent is a row and is without arguments", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        const column = await row.addColumn();

        expect(column).to.not.be.undefined;
        expect(column.constructor.name).to.eql("Column");
    });

    it("add the column when the parent is a row and is without arguments", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        await row.addColumn();
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    describe("", () => {
        beforeEach(async () => {
            await glue.workspaces.createWorkspace(config);
        });

        it("return the column when the parent is a row and is passed a column definition when the workspace is not focused", async () => {
            const allParents = workspace.getAllParents();
            const row = allParents.find(p => p.type === "row");
            const column = await row.addColumn({ type: "column", children: [] });

            expect(column).to.not.be.undefined;
            expect(column.constructor.name).to.eql("Column");
        });

        it("add the column when the parent is a row and is passed a column definition when the workspace is not focused", async () => {
            const allParents = workspace.getAllParents();
            const row = allParents.find(p => p.type === "row");
            await row.addColumn({ type: "column", children: [] });
            await workspace.refreshReference();

            const allParentsAfterAdd = workspace.getAllParents();
            expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
        });

        it("return the column when the parent is a row and is passed column as a type when the workspace is not focused", async () => {
            const allParents = workspace.getAllParents();
            const row = allParents.find(p => p.type === "row");
            const column = await row.addColumn({ type: "column" });

            expect(column).to.not.be.undefined;
            expect(column.constructor.name).to.eql("Column");
        });

        it("add the column when the parent is a row and is  passed column as a type when the workspace is not focused", async () => {
            const allParents = workspace.getAllParents();
            const row = allParents.find(p => p.type === "row");
            await row.addColumn({ type: "column" });
            await workspace.refreshReference();

            const allParentsAfterAdd = workspace.getAllParents();
            expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
        });

        it("return the column when the parent is a row and a children array is passed when the workspace is not focused", async () => {
            const allParents = workspace.getAllParents();
            const row = allParents.find(p => p.type === "row");
            const column = await row.addColumn({ children: [] });

            expect(column).to.not.be.undefined;
            expect(column.constructor.name).to.eql("Column");
        });

        it("add the column when the parent is a row and a children array is passed when the workspace is not focused", async () => {
            const allParents = workspace.getAllParents();
            const row = allParents.find(p => p.type === "row");
            await row.addColumn({ children: [] });
            await workspace.refreshReference();

            const allParentsAfterAdd = workspace.getAllParents();
            expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
        });

        it("return the column when the parent is a row and is without arguments when the workspace is not focused", async () => {
            const allParents = workspace.getAllParents();
            const row = allParents.find(p => p.type === "row");
            const column = await row.addColumn();

            expect(column).to.not.be.undefined;
            expect(column.constructor.name).to.eql("Column");
        });

        it("add the column when the parent is a row and is without arguments when the workspace is not focused", async () => {
            const allParents = workspace.getAllParents();
            const row = allParents.find(p => p.type === "row");
            await row.addColumn();
            await workspace.refreshReference();

            const allParentsAfterAdd = workspace.getAllParents();
            expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
        });
    });

    it("reject when the parent is a column and is passed a column definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "column");
        row.addColumn({ type: "column", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    });

    it("reject when the parent is a group and is passed a column definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "group");
        row.addColumn({ type: "column", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    });

    it("reject when the parent is a row and the arguments is a row definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        row.addColumn({ type: "row", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a row and the arguments is a group definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        row.addColumn({ type: "group", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a row and the arguments is a window definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        row.addColumn({ type: "window" }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })
});