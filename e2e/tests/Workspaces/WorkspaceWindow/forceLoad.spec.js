describe.skip("forceLoad() Should", () => {
    const windowConfig = {
        type: "window",
        appName: "dummyApp"
    };

    const basicConfig = {
        children: [
            {
                type: "row",
                children: [
                ]
            }
        ]
    }

    let workspace = undefined;
    // BUG
    before(async () => {
        await Promise.all([glueReady, gtfReady]);
        workspace = await glue.workspaces.createWorkspace(basicConfig);
    });

    afterEach(async () => {
        await workspace.refreshReference();

        const windows = workspace.getAllWindows();

        await Promise.all(windows.map(w => w.close()));
    });

    after(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    it("return a promise", async () => {
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        const windows = workspace.getAllWindows();
        const window = windows[0];
        const forceLoadPromise = window.forceLoad();

        expect(forceLoadPromise.then).to.be.a("function");
        expect(forceLoadPromise.catch).to.be.a("function");
    });

    it("resolve the promise", async () => {
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        const windows = workspace.getAllWindows();
        const window = windows[0];
        await window.forceLoad();
    });

    it("change the window state to loaded", async () => {
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        let windows = workspace.getAllWindows();
        let window = windows[0];

        await window.forceLoad();
        await workspace.refreshReference();

        windows = workspace.getAllWindows();
        window = windows[0];

        expect(window.isLoaded).to.be.true;
    });

    it("add a new gd window", async () => {
        const gdWindows = glue.windows.list();
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        let windows = workspace.getAllWindows();
        let window = windows[0];

        await window.forceLoad();
        await workspace.refreshReference();

        const gdWindowsAfterLoad = glue.windows.list();
        expect(gdWindowsAfterLoad.length).to.eql(gdWindows.length + 1);
    });

    it("be able to return the gd window", async () => {
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        let windows = workspace.getAllWindows();
        let window = windows[0];

        await window.forceLoad();
        await workspace.refreshReference();

        windows = workspace.getAllWindows();
        window = windows[0];

        expect(window.getGdWindow()).to.not.be.undefined;
    });

    describe("", () => {
        before(async() => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        it("resolve the promise when the workspace is not focused", async () => {
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            const windows = workspace.getAllWindows();
            const window = windows[0];
            await window.forceLoad();
        });

        it("change the window state to loaded when the workspace is not focused", async () => {
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            let windows = workspace.getAllWindows();
            let window = windows[0];

            await window.forceLoad();
            await workspace.refreshReference();

            windows = workspace.getAllWindows();
            window = windows[0];

            expect(window.isLoaded).to.be.true;
        });

        it("add a new gd window when the workspace is not focused", async () => {
            const gdWindows = glue.windows.list();
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            let windows = workspace.getAllWindows();
            let window = windows[0];

            await window.forceLoad();
            await workspace.refreshReference();

            const gdWindowsAfterLoad = glue.windows.list();
            expect(gdWindowsAfterLoad.length).to.eql(gdWindows.length + 1);
        });

        it("be able to return the gd window when the workspace is not focused", async () => {
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            let windows = workspace.getAllWindows();
            let window = windows[0];

            await window.forceLoad();
            await workspace.refreshReference();

            windows = workspace.getAllWindows();
            window = windows[0];

            expect(window.getGdWindow()).to.not.be.undefined;
        });
    });

    // TODO check the loading when the window won't load on its own

});