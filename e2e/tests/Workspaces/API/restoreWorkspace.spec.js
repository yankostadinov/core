describe('restoreWorkspace() Should', function () {

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
    };

    let workspace;
    const layoutName = "layout.integration.tests";
    
    before(() => {
        return Promise.all([glueReady, gtfReady]);
    });

    beforeEach(async () => {
        workspace = await glue.workspaces.createWorkspace(basicConfig);
        // BUG
        await workspace.saveLayout(layoutName);
    });

    afterEach(async () => {
        await glue.workspaces.layouts.delete(layoutName);
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("restore the layout when the arguments are correct and the workspace is still opened", async () => {
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName);
        const summaries = await glue.workspaces.getAllWorkspacesSummaries();

        expect(summaries.length).to.eql(2);
    });

    it("restore the layout when the arguments are correct and the workspace is closed", async () => {
        await workspace.close();
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName);
        const summaries = await glue.workspaces.getAllWorkspacesSummaries();

        expect(summaries.length).to.eql(1);
    });

    it("restore the layout when the workspace is still opened and the options are an empty object", async () => {
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, {});
        const summaries = await glue.workspaces.getAllWorkspacesSummaries();

        expect(summaries.length).to.eql(2);
    });

    it("restore the layout when the workspace is closed and the options are an empty object", async () => {
        await workspace.close();
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, {});
        const summaries = await glue.workspaces.getAllWorkspacesSummaries();

        expect(summaries.length).to.eql(1);
    });

    it("restore the layout in the same frame when the workspace is still opened and the options are an empty object", async () => {
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, {});
        const frames = await glue.workspaces.getAllFrames();

        expect(frames.length).to.eql(1);
    });

    it("restore the layout in the same frame when the workspace is still opened", async () => {
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName);
        const frames = await glue.workspaces.getAllFrames();

        expect(frames.length).to.eql(1);
    });

    it("restore same layout 2 times in the same frame when the workspace is restored twice only by name", async () => {
        await workspace.close();
        const firstWorkspace = await glue.workspaces.restoreWorkspace(layoutName);
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName);
        const frames = await glue.workspaces.getAllFrames();
        const workspaceSummaries = await glue.workspaces.getAllWorkspacesSummaries();

        expect(frames.length).to.eql(1);
        expect(workspaceSummaries.length).to.eql(2);
    });

    it("restore same layout 2 times in the same frame when the workspace is restored twice with an empty object", async () => {
        await workspace.close();
        const firstWorkspace = await glue.workspaces.restoreWorkspace(layoutName, {});
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, {});
        const frames = await glue.workspaces.getAllFrames();
        const workspaceSummaries = await glue.workspaces.getAllWorkspacesSummaries();

        expect(frames.length).to.eql(1);
        expect(workspaceSummaries.length).to.eql(2);
    });

    it("restore the layout in the same frame when the workspace is still opened and newFrame is false", async () => {
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, { newFrame: false });
        const frames = await glue.workspaces.getAllFrames();

        expect(frames.length).to.eql(1);
    });

    it("restore the layout in the same frame when the workspace is still opened and frameId is passed", async () => {
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, { frameId: workspace.frameId });
        const frames = await glue.workspaces.getAllFrames();

        expect(frames.length).to.eql(1);
    });

    it.skip("reuse the specified workspace when the reuseWorkspaceIdOptions is passed", async () => {
        await workspace.addWindow({
            type: "window",
            appName: "dummyApp"
        });
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, { reuseWorkspaceId: workspace.id });
        const workspaceSummaries = await glue.workspaces.getAllWorkspacesSummaries();
        const workspaceWindows = secondWorkspace.getAllWindows();

        expect(workspaceSummaries.length).to.eql(1);
        expect(workspaceWindows.length).to.eql(1);
    });

    it("restore the layout in a new frame when the workspace is still opened and newFrame is true", async () => {
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, { newFrame: true });
        const frames = await glue.workspaces.getAllFrames();

        expect(frames.length).to.eql(2);
    });

    it("restore the layout with the given title when a title is passed", async () => {
        const title = "myNewTitle";
        const secondWorkspace = await glue.workspaces.restoreWorkspace(layoutName, { title });
        const frames = await glue.workspaces.getAllFrames();

        expect(secondWorkspace.title).to.eql(title);
    });

    it("reject the promise when there isn't a layout with such name", (done) => {
        glue.workspaces.restoreWorkspace("some missing layout").then(() => {
            done("Should not resolve");
        }).catch(() => done());
    });

    Array.from([null, undefined, 42, "SomeString", [], {}]).forEach((input) => {
        if (typeof input != "string") {
            it(`reject the promise when the name parameter is ${JSON.stringify(input)}`, (done) => {
                glue.workspaces.restoreWorkspace(input).then(() => {
                    done("Should not resolve");
                }).catch(() => done());
            });
        }

        if (typeof input != "undefined" && typeof input != "object") {
            it(`reject the promise when the options parameter is ${JSON.stringify(input)}`, (done) => {
                glue.workspaces.restoreWorkspace(layoutName, input).then(() => {
                    done("Should not resolve");
                }).catch(() => done());
            });
        }
    });
});
