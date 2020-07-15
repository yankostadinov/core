describe("getParent() Should", () => {
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
        ],
        frame: {
            newFrame: true
        }
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

    it("return a promise", () => {
        const parentPromise = glue.workspaces.getParent(p => p.type === "column");

        expect(parentPromise.then).to.be.a("function");
        expect(parentPromise.catch).to.be.a("function");
    });

    it("resolve", async () => {
        await glue.workspaces.getParent(p => p.type === "column");
    });

    it("return the correct parent", async () => {
        const firstParent = await glue.workspaces.getParent(p => p.type === "column");
        const secondParent = await glue.workspaces.getParent(p => p.type === "row");
        const thirdParent = await glue.workspaces.getParent(p => p.type === "group");

        expect(firstParent.type).to.eql("column");
        expect(secondParent.type).to.eql("row");
        expect(thirdParent.type).to.eql("group");
    });

    Array.from([null, undefined, 42, "42", [], {}]).forEach((input) => {
        it(`reject when the argument is ${JSON.stringify(input)}`, (done) => {
            glue.workspaces.getParent(input)
                .then(() => done("Should not resolve"))
                .catch(() => done());
        });
    });
});