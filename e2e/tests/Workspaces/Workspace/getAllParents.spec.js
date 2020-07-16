describe("getAllParents() Should", () => {
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
    //TODO add predicate tests
    before(async () => {
        await Promise.all([glueReady, gtfReady]);
        workspace = await glue.workspaces.createWorkspace(basicConfig);
    });

    after(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("return all parents", () => {
        const parents = workspace.getAllParents();

        const rows = parents.filter(p => p.type === "row");
        const columns = parents.filter(p => p.type === "column");
        const groups = parents.filter(p => p.type === "group");

        expect(parents.length).to.eql(6);
        expect(rows.length).to.eql(2);
        expect(columns.length).to.eql(3);
        expect(groups.length).to.eql(1);
    });

    // Not focused workspace
    it("return all parents when the workspace is not focused", async () => {
        await glue.workspaces.createWorkspace(basicConfig);
        const parents = workspace.getAllParents();

        const rows = parents.filter(p => p.type === "row");
        const columns = parents.filter(p => p.type === "column");
        const groups = parents.filter(p => p.type === "group");

        expect(parents.length).to.eql(6);
        expect(rows.length).to.eql(2);
        expect(columns.length).to.eql(3);
        expect(groups.length).to.eql(1);
    });

    Array.from([null, 42, "42", {}, []]).forEach((input) => {
        it(`throw an error when the input is ${JSON.stringify(input)}`, (done) => {
            try {
                workspace.getAllParents(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });
    });
});