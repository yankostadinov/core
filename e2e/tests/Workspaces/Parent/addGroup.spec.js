describe("addGroup() Should", () => {
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

    it("return the group when the parent is a row and is passed a group definition", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        const group = await row.addGroup({ type: "group", children: [] });

        expect(group).to.not.be.undefined;
        expect(group.constructor.name).to.eql("Group");
    });

    it("add the group when the parent is a row and is passed a group definition", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        await row.addGroup({ type: "group", children: [] });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the group when the parent is a row and is passed group as a type", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        const group = await row.addGroup({ type: "group" });

        expect(group).to.not.be.undefined;
        expect(group.constructor.name).to.eql("Group");
    });

    it("add the group when the parent is a row and is passed group as a type", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        await row.addGroup({ type: "group" });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the group when the parent is a row and a children array is passed", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        const group = await row.addGroup({ children: [] });

        expect(group).to.not.be.undefined;
        expect(group.constructor.name).to.eql("Group");
    });

    it("add the group when the parent is a row and a children array is passed", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        await row.addGroup({ children: [] });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the group when the parent is a row and is without arguments", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        const group = await row.addGroup();

        expect(group).to.not.be.undefined;
        expect(group.constructor.name).to.eql("Group");
    });

    it("add the group when the parent is a row and is without arguments", async () => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        await row.addGroup();
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the group when the parent is a column and is passed a group definition", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        const group = await column.addGroup({ type: "group", children: [] });

        expect(group).to.not.be.undefined;
        expect(group.constructor.name).to.eql("Group");
    });

    it("add the group when the parent is a column and is passed a group definition", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        await column.addGroup({ type: "group", children: [] });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the group when the parent is a column and is passed group as a type", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        const group = await column.addGroup({ type: "group" });

        expect(column).to.not.be.undefined;
        expect(group.constructor.name).to.eql("Group");
    });

    it("add the group when the parent is a column and is passed group as a type", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        await column.addGroup({ type: "group" });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the group when the parent is a column and a children array is passed", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        const group = await column.addGroup({ children: [] });

        expect(group).to.not.be.undefined;
        expect(group.constructor.name).to.eql("Group");
    });

    it("add the group when the parent is a column and a children array is passed", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        await column.addGroup({ children: [] });
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("return the group when the parent is a column and is without arguments", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        const group = await column.addGroup();

        expect(group).to.not.be.undefined;
        expect(group.constructor.name).to.eql("Group");
    });

    it("add the group when the parent is a column and is without arguments", async () => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        await column.addGroup();
        await workspace.refreshReference();

        const allParentsAfterAdd = workspace.getAllParents();
        expect(allParentsAfterAdd.length).to.eql(allParents.length + 1);
    });

    it("reject when the parent is a group and is passed a group definition", (done) => {
        const allParents = workspace.getAllParents();
        const group = allParents.find(p => p.type === "group");
        group.addGroup({ type: "group", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());

    });

    it("reject when the parent is a row and the arguments is a row definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        row.addGroup({ type: "row", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a row and the arguments is a column definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        row.addGroup({ type: "column", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a row and the arguments is a window definition", (done) => {
        const allParents = workspace.getAllParents();
        const row = allParents.find(p => p.type === "row");
        row.addGroup({ type: "window" }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a column and the arguments is a row definition", (done) => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        column.addGroup({ type: "column", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a column and the arguments is a column definition", (done) => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        column.addGroup({ type: "column", children: [] }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })

    it("reject when the parent is a column and the arguments is a window definition", (done) => {
        const allParents = workspace.getAllParents();
        const column = allParents.find(p => p.type === "column");
        column.addGroup({ type: "window" }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    })
});