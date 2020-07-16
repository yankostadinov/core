// @ts-check
describe("properties: ", () => {
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
    };
    let workspace;
    before(async () => {
        await Promise.all([glueReady, gtfReady]);
        workspace = await glue.workspaces.createWorkspace(threeContainersConfig);
    });

    after(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });


    describe("type: ", () => {
        Array.from(["group", "column", "row"]).forEach((parent) => {
            it(`Should be "${parent}" when the parent is a ${parent}`, () => {
                const currParent = workspace.getParent(p => p.type === parent);

                expect(currParent.type).to.eql(parent);
            });
        });
    })

    describe("id: ", () => {
        Array.from(["group", "column", "row"]).forEach((parent) => {

            it(`Should not be undefined when the parent is a ${parent}`, () => {
                const currParent = workspace.getParent(p => p.type === parent);

                expect(currParent.id).to.not.be.undefined;
                expect(currParent.id.length).to.not.eql(0);
            });
        });

    });

    describe("frameId: ", () => {
        Array.from(["group", "column", "row"]).forEach((parent) => {

            it(`Should be correct when the parent is a ${parent}`, () => {
                const currParent = workspace.getParent(p => p.type === parent);

                expect(currParent.frameId).to.eql(workspace.frameId);
            });

            it(`Should not be undefined when the parent is a ${parent}`, () => {
                const currParent = workspace.getParent(p => p.type === parent);

                expect(currParent.frameId).to.not.be.undefined;
                expect(currParent.frameId.length).to.not.eql(0);
            });
        });

    });

    describe("workspaceId: ", () => {
        Array.from(["group", "column", "row"]).forEach((parent) => {

            it(`Should be correct when the parent is a ${parent}`, () => {
                const currParent = workspace.getParent(p => p.type === parent);

                expect(currParent.workspaceId).to.eql(workspace.id);
            });

            it(`Should not be undefined when the parent is a ${parent}`, () => {
                const currParent = workspace.getParent(p => p.type === parent);

                expect(currParent.workspaceId).to.not.be.undefined;
                expect(currParent.workspaceId.length).to.not.eql(0);
            });
        });

    });

});