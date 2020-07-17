describe("addWindow() Should", () => {
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

    Array.from(["row", "column", "group"]).forEach((parentType) => {
        it(`return the added window when the parent is a ${parentType}`, async () => {
            const parent = workspace.getAllParents().find(p => p.type === parentType);
            const window = await parent.addWindow({
                type: "window",
                appName: "dummyApp"
            });

            expect(window).to.not.be.undefined;
            expect(window.constructor.name).to.eql("Window");
        });

        it(`add the window when the parent is ${parentType}`, async () => {
            const parent = workspace.getAllParents().find(p => p.type === parentType);
            const window = await parent.addWindow({
                type: "window",
                appName: "dummyApp"
            });

            await workspace.refreshReference();

            const windows = workspace.getAllWindows();

            expect(windows.length).to.eql(2);
        });

        describe("",() => {
            beforeEach(async () => {
                 await glue.workspaces.createWorkspace(config);
            });
        
            it(`return the added window when the parent is a ${parentType} and the workspace is not focused`, async () => {
                const parent = workspace.getAllParents().find(p => p.type === parentType);
                const window = await parent.addWindow({
                    type: "window",
                    appName: "dummyApp"
                });
    
                expect(window).to.not.be.undefined;
                expect(window.constructor.name).to.eql("Window");
            });
    
            it(`add the window when the parent is ${parentType} and the workspace is not focused`, async () => {
                const parent = workspace.getAllParents().find(p => p.type === parentType);
                const window = await parent.addWindow({
                    type: "window",
                    appName: "dummyApp"
                });
    
                await workspace.refreshReference();
    
                const windows = workspace.getAllWindows();
    
                expect(windows.length).to.eql(2);
            });
        });

        Array.from(["42", 42, [], {}, undefined, null]).forEach((input) => {
            it(`reject when the parent is ${parentType} and the argument is ${JSON.stringify(input)}`, (done) => {
                const parent = workspace.getAllParents().find(p => p.type === parentType);
                parent.addWindow(input)
                    .then(() => done("Should not resolve"))
                    .catch(() => done());
            });
        });
    });
});