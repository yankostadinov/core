describe("eject() Should", () => {
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
    let windowsForClosing = [];

    before(async () => {
        await Promise.all([glueReady, gtfReady]);
    });

    beforeEach(async () => {
        workspace = await glue.workspaces.createWorkspace(basicConfig);
    })

    afterEach(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((f) => f.close()));
    });

    // The windows can't be closed
    it("return a promise", async () => {
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        const windows = workspace.getAllWindows();
        const window = windows[0];
        await window.forceLoad();
        windowsForClosing.push(window.getGdWindow());
        const ejectPromise = window.eject();

        expect(ejectPromise.then).to.be.a("function");
        expect(ejectPromise.catch).to.be.a("function");
    });

    it("resolve the promise", async () => {
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        const windows = workspace.getAllWindows();
        const window = windows[0];
        await window.forceLoad();

        windowsForClosing.push(window.getGdWindow());

        await window.eject();
    });

    it("remove the workspace window when it is invoked after the window was loaded", async () => {
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        const windows = workspace.getAllWindows();
        const window = windows[0];
        await window.forceLoad();
        windowsForClosing.push(window.getGdWindow());
        await window.eject();
        await workspace.refreshReference();
        const windowsAfterEject = workspace.getAllWindows();

        expect(windowsAfterEject.length).to.eql(0);
    });

    it("don't close the gdWindow when the window is loaded", async () => {
        const gdWindows = glue.windows.list();
        await workspace.addWindow(windowConfig);

        await workspace.refreshReference();

        const windows = workspace.getAllWindows();
        const window = windows[0];
        await window.forceLoad();

        windowsForClosing.push(window.getGdWindow());
        await window.eject();
        const windowsAfterEject = glue.windows.list();

        expect(windowsAfterEject.length).to.eql(gdWindows.length + 1);
    });

    describe("", () => {
        before(async () => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        it("resolve the promise when the workspace is not focused", async () => {
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            const windows = workspace.getAllWindows();
            const window = windows[0];
            await window.forceLoad();

            windowsForClosing.push(window.getGdWindow());

            await window.eject();
        });

        it("remove the workspace window when it is invoked before the window was loaded and the workspace is not focused", async () => {
            // Potential race if the window loads very fast
            // TODO refactor
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            const windows = workspace.getAllWindows();
            const window = windows[0];
            await window.forceLoad();

            windowsForClosing.push(window.getGdWindow());
            await window.eject();

            await workspace.refreshReference();
            const windowsAfterEject = workspace.getAllWindows();

            expect(windowsAfterEject.length).to.eql(0);
        });

        it("remove the workspace window when it is invoked after the window was loaded and the workspace is not focused", async () => {
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            const windows = workspace.getAllWindows();
            const window = windows[0];
            await window.forceLoad();

            windowsForClosing.push(window.getGdWindow());
            await window.eject();
            await workspace.refreshReference();
            const windowsAfterEject = workspace.getAllWindows();

            expect(windowsAfterEject.length).to.eql(0);
        });

        it("don't close the gdWindow when the window is loaded and the workspace is not focused", async () => {
            const gdWindows = glue.windows.list();
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            const windows = workspace.getAllWindows();
            const window = windows[0];
            await window.forceLoad();
            windowsForClosing.push(window.getGdWindow());
            await window.eject();
            const windowsAfterEject = glue.windows.list();

            expect(windowsAfterEject.length).to.eql(gdWindows.length + 1);
        });
    })

    it("reject when invoked twice on the same window and the window is loaded", async () => {
        let errorThrown = false;
        try {
            await workspace.addWindow(windowConfig);

            await workspace.refreshReference();

            const windows = workspace.getAllWindows();
            const window = windows[0];
            await window.forceLoad();

            windowsForClosing.push(window.getGdWindow());
            await Promise.all([window.eject(), window.eject()]);
        } catch (error) {
            errorThrown = true;
        }

        expect(errorThrown).to.be.true;
    });
});