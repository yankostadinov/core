describe('addGroup() Should ', function () {
    const basicConfig = {
        children: [
            {
                type: "column",
                children: [
                    {
                        type: "window",
                        appName: "dummyApp"
                    }
                ]
            }
        ]
    }
    let workspace = undefined;

    before(() => {
        return Promise.all([glueReady, gtfReady]);
    });

    beforeEach(async () => {
        workspace = await glue.workspaces.createWorkspace(basicConfig);
    })

    afterEach(async () => {
        const frames = await glue.workspaces.getAllFrames();
        await Promise.all(frames.map((frame) => frame.close()));
    });

    it("return a promise", () => {
        expect(workspace.addGroup().then).to.be.a("function");;
        expect(workspace.addGroup().catch).to.be.a("function");;
    });

    it("resolve", async () => {
        await workspace.addGroup();
    });

    it("resolve with a group", async () => {
        const group = await workspace.addGroup();

        expect(group.constructor.name).to.eql("Group");
    });

    Array.from({ length: 5 }).forEach((_, i) => {
        it(`add ${i + 1} empty group/s to the workspace`, async () => {

            const groups = await Promise.all(Array.from({ length: i + 1 }).map(() => {
                return workspace.addGroup();
            }))

            await workspace.refreshReference();
            const allGroups = workspace.getAllGroups();

            const groupChildren = groups.reduce((acc, r) => [...acc, ...r.getAllChildren()], []);

            expect(allGroups.length).to.eql(i + 1);
            expect(groupChildren.length).to.eql(0);
        })
    });

    describe("", () => {
        beforeEach(async () => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        // Not focused workspace
        it("return a promise when the workspace is not focused", () => {
            expect(workspace.addGroup().then).to.be.a("function");;
            expect(workspace.addGroup().catch).to.be.a("function");;
        });

        it("resolve when the workspace is not focused", async () => {
            await workspace.addGroup();
        });

        it("resolve with a group when the workspace is not focused", async () => {
            const group = await workspace.addGroup();

            expect(group.constructor.name).to.eql("Group");
        });

        Array.from({ length: 5 }).forEach((_, i) => {
            it(`add ${i + 1} group/s to the workspace when the workspace is not focused`, async () => {
                await Promise.all(Array.from({ length: i + 1 }).map(() => {
                    return workspace.addGroup();
                }))

                await workspace.refreshReference();
                const allGroups = workspace.getAllGroups();

                expect(allGroups.length).to.eql(i + 1);
            });

            it(`add ${i + 1} empty group/s to the workspace when the workspace is not focused`, async () => {

                const groups = await Promise.all(Array.from({ length: i + 1 }).map(() => {
                    return workspace.addGroup();
                }))

                await workspace.refreshReference();
                const allGroups = workspace.getAllGroups();

                const groupChildren = groups.reduce((acc, r) => [...acc, ...r.getAllChildren()], []);

                expect(allGroups.length).to.eql(i + 1);
                expect(groupChildren.length).to.eql(0);
            });
        });
    });


    // TODO add tests with config
    Array.from([42, []]).forEach((input) => {
        it(`reject when the input is ${JSON.stringify(input)}`, (done) => {
            workspace.addGroup(input).then(() => {
                done("Should not resolve");
            }).catch(() => done());
        });
    })
});
