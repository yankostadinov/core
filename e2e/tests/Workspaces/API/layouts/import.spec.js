describe('import() Should ', function () {
    let basicImport = {
        name: "layout.random.1",
        type: "Workspaces",
        layout: {
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
            ]
        }
    }
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
        ]
    }
    before(async () => {
        await Promise.all([glueReady, gtfReady]);
        const workspace = await glue.workspaces.createWorkspace(basicConfig);
        await workspace.saveLayout("layout.random.1");
        basicImport = (await glue.workspaces.layouts.export()).find(l => l.name === "layout.random.1");
    });

    let layoutsForCleanup = [];

    afterEach(async () => {
        const summaries = await glue.workspaces.layouts.getSummaries();
        await Promise.all(layoutsForCleanup.map(l => {
            if (summaries.some(s => s.name.startsWith("layout."))) {
                return glue.workspaces.layouts.delete(l);
            }
        }));
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("import the layout when the layout is valid", async () => {
        await glue.workspaces.layouts.import([basicImport]);

        const summaries = await glue.workspaces.layouts.getSummaries();

        const summariesContainLayout = summaries.some(s => s.name === basicImport.name);

        expect(summariesContainLayout).to.be.true;
    });

    it("reject when the layout is an invalid object", (done) => {
        glue.workspaces.layouts.import({ a: "not a layout" }).then(() => {
            done("Should not resolve");
        }).catch(() => done());
    });

    Array.from([null, undefined, {}, "layout", 42]).forEach((input) => {
        it(`reject when the layout is a ${JSON.stringify(input)}`, (done) => {
            glue.workspaces.layouts.import(input).then(() => {
                done("Should not resolve");
            }).catch(() => done());
        });
    });
});
