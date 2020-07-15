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

    describe("id: ", () => {
        it(`Should not be undefined`, () => {
            expect(workspace.id).to.not.be.undefined;
            expect(workspace.id.length).to.not.eql(0);
        });
    });

    describe("frameId: ", () => {
        it(`Should be correct`, async () => {
            const currFrame = (await glue.workspaces.getAllFrames())[0];

            expect(workspace.frameId).to.eql(currFrame.id);
        });

        it(`Should not be undefined`, () => {
            expect(workspace.frameId).to.not.be.undefined;
            expect(workspace.frameId.length).to.not.eql(0);
        });
    });

    describe("title: ", () => {
        it(`Should not be undefined`, () => {
            expect(workspace.title).to.not.be.undefined;
            expect(workspace.title.length).to.not.eql(0);
        });
    });

    describe("positionIndex: ", () => {
        it(`Should be 0 when the workspace is first`, () => {
            expect(workspace.positionIndex).to.eql(0);
        });
    });
});