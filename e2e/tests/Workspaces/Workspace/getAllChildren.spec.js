describe("getAllChildren() Should", () => {
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

    it("return only the immediate children", () => {
        const children = workspace.getAllChildren();

        expect(children.length).to.eql(1);
        expect(children[0].type).to.eql("row");
    });

    // Not focused workspace
    it("return only the immediate children when the workspace is not focused", async () => {
        await glue.workspaces.createWorkspace(basicConfig);
        const children = workspace.getAllChildren();

        expect(children.length).to.eql(1);
        expect(children[0].type).to.eql("row");
    });

    Array.from([null, 42, "42", {}, []]).forEach((input) => {
        it(`throw an error when the input is ${JSON.stringify(input)}`, (done) => {
            try {
                workspace.getAllChildren(input);
                done("Should have thrown an error");
            } catch (error) {
                done();
            }
        });
    });
});