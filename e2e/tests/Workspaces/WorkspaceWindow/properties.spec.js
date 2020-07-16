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
    // BUG
    before(async () => {
        await Promise.all([glueReady, gtfReady]);
        workspace = await glue.workspaces.createWorkspace(threeContainersConfig);
    });

    after(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    describe("id: ", () => {
        it(`Should not be undefined`, async() => {
            const window = workspace.getAllWindows()[0];
            await window.forceLoad();
            expect(window.id).to.not.be.undefined;
            expect(window.id.length).to.not.eql(0);
        });
    });

    describe("frameId: ", () => {
        it(`Should be correct`, async () => {
            const currFrame = (await glue.workspaces.getAllFrames())[0];
            const window = workspace.getAllWindows()[0];

            expect(window.frameId).to.eql(currFrame.id);
        });

        it(`Should not be undefined`, () => {
            const window = workspace.getAllWindows()[0];
            expect(window.frameId).to.not.be.undefined;
            expect(window.frameId.length).to.not.eql(0);
        });
    });

    describe("workspaceId: ", () => {
        it(`Should be correct`, async () => {
            const window = workspace.getAllWindows()[0];

            expect(window.workspaceId).to.eql(workspace.id);
        });

        it(`Should not be undefined`, () => {
            const window = workspace.getAllWindows()[0];
            expect(window.workspaceId).to.not.be.undefined;
            expect(window.workspaceId).to.not.eql(0);
        });
    });

    describe("title: ", () => {
        it(`Should not be undefined`, () => {
            const window = workspace.getAllWindows()[0];
            expect(window.title).to.not.be.undefined;
            expect(window.title.length).to.not.eql(0);
        });
    });

    describe("type: ", () => {
        it(`Should be window`, () => {
            const window = workspace.getAllWindows()[0];
            expect(window.type).to.eql("window");
        });
    });

    describe("positionIndex: ", () => {
        it(`Should be 0 when the window is first`, () => {
            const window = workspace.getAllWindows()[0];
            expect(window.positionIndex).to.eql(0);
        });
    });

    describe("isMaximized: ", () => {
        it(`Should be false when the window is not maximized`, () => {
            const window = workspace.getAllWindows()[0];
            expect(window.isMaximized).to.be.false;
        });
    });

    describe("isLoaded: ", () => {
        it(`Should be true when the window is loaded`, async () => {
            const window = workspace.getAllWindows()[0];
            await window.forceLoad();

            expect(window.isLoaded).to.be.true;
        });
    });

    describe("focused: ", () => {
        it(`Should be boolean`, () => {
            const window = workspace.getAllWindows()[0];

            expect(typeof window.focused).to.eql("boolean");
        });
    });
});