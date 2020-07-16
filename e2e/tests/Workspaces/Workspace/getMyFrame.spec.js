describe('getMyFrame() Should ', function () {
    const basicConfig = {
        children: [
            {
                type: "row",
                children: [
                    {
                        type: "window",
                        appName: "dummyApp"
                    }
                ]
            }
        ],
        frame: {
            newFrame: true,
        }
    }

    
    before(() => {
        return Promise.all([glueReady, gtfReady]);
    });

    afterEach(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    Array.from({ length: 3 }).forEach((_, i) => {
        it(`return the correct frame for all ${i + 1} workspaces when there are ${i + 1} workspaces open in different frames`, async () => {
            await glue.workspaces.createWorkspace(basicConfig);

            const workspaces = await Promise.all(Array.from({ length: i + 1 }).map(() => {
                return glue.workspaces.createWorkspace(basicConfig);
            }));

            workspaces.forEach(w => {
                const workspaceFrame = w.getMyFrame();

                expect(workspaceFrame.id).to.eql(w.frameId);
            });
        });
    });

});
