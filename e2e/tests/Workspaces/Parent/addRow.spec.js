describe("addRow() Should", () => {
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
        await glue.workspaces.createWorkspace(config);
        workspace = await glue.workspaces.createWorkspace(config);
        await glue.workspaces.createWorkspace(config);
    });

    afterEach(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("return the row when the parent is a column and is passed a row definition", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        const row = await column.addRow({ type: "row", children: [] });

        expect(row).to.not.be.undefined;
        expect(row.constructor.name).to.eql("Row");
    });

    it("add the row when the parent is a colum and is passed a row definition", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        await column.addRow({ type: "row", children: [] });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the row when the parent is a column and is passed row as a type", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        const row = await column.addRow({ type: "row" });

        expect(row).to.not.be.undefined;
        expect(row.constructor.name).to.eql("Row");
    });

    it("add the row when the parent is a column and is passed row as a type", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        await column.addRow({ type: "row" });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the row when the parent is a column and a children array is passed", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        const row = await column.addRow({ children: [] });

        expect(row).to.not.be.undefined;
        expect(row.constructor.name).to.eql("Row");
    });

    it("add the row when the parent is a column and a children array is passed", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        await column.addRow({ children: [] });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the row when the parent is a column and is without arguments", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        const row = await column.addRow();

        expect(row).to.not.be.undefined;
        expect(row.constructor.name).to.eql("Row");
    });

    it("add the row when the parent is a column and is without arguments", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        await column.addRow();
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("reject when the parent is a row and is passed a row definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        row.addRow({ type: "row", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());

    });

    it("reject when the parent is a group and is passed a row definition", (done) => {
        const allParents = workspace.getAllParents();
        const group = allParents.find(p => p.type === "group");
        group.addRow({ type: "row", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    });

    it("reject when the parent is a column and the arguments is a column definition", (done) => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        column.addRow({ type: "column", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a column and the arguments is a group definition", (done) => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        column.addRow({ type: "group", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a row and the arguments is a window definition", (done) => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        column.addRow({ type: "window" }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })
});