describe('addRow() Should ', function () {
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
        await Promise.all(frames.map((f) => f.close()));
    });

    it("return a promise", () => {
        expect(workspace.addRow().then).to.be.a("function");;
        expect(workspace.addRow().catch).to.be.a("function");;
    });

    it("resolve", async () => {
        await workspace.addRow();
    });

    it("resolve with a row", async () => {
        const row = await workspace.addRow();

        expect(row.constructor.name).to.eql("Row");
    });

    Array.from({ length: 5 }).forEach((_, i) => {
        it(`add ${i + 1} empty row/s to the workspace`, async () => {

            const rows = await Promise.all(Array.from({ length: i + 1 }).map(() => {
                return workspace.addRow();
            }))

            await workspace.refreshReference();
            const allRows = workspace.getAllRows();
            const rowChildren = rows.reduce((acc, r) => [...acc, ...r.getAllChildren()], []);

            expect(allRows.length).to.eql(i + 1);
            expect(rowChildren.length).to.eql(0);
        })
    });

    describe("", () => {
        beforeEach(async () => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        // Not focused workspace
        it("return a promise when the workspace is not focused", () => {
            expect(workspace.addRow().then).to.be.a("function");;
            expect(workspace.addRow().catch).to.be.a("function");;
        });

        it("resolve when the workspace is not focused", async () => {
            await workspace.addRow();
        });

        it("resolve with a row when the workspace is not focused", async () => {
            const row = await workspace.addRow();

            expect(row.constructor.name).to.eql("Row");
        });

        Array.from({ length: 5 }).forEach((_, i) => {
            it(`add ${i + 1} row/s to the workspace when the workspace is not focused`, async () => {
                await Promise.all(Array.from({ length: i + 1 }).map(() => {
                    return workspace.addRow();
                }));

                await workspace.refreshReference();
                const allRows = workspace.getAllRows();

                expect(allRows.length).to.eql(i + 1);
            });

            it(`add ${i + 1} empty row/s to the workspace when the workspace is not focused`, async () => {

                const rows = await Promise.all(Array.from({ length: i + 1 }).map(() => {
                    return workspace.addRow();
                }));

                await workspace.refreshReference();
                const allRows = workspace.getAllRows();
                const rowChildren = rows.reduce((acc, r) => [...acc, ...r.getAllChildren()], []);

                expect(allRows.length).to.eql(i + 1);
                expect(rowChildren.length).to.eql(0);
            });
        });
    });

    // TODO add tests with config
    Array.from([42, []]).forEach((input) => {
        it(`reject when the input is ${JSON.stringify(input)}`, (done) => {
            workspace.addRow(input).then(() => {
                done("Should not resolve");
            }).catch(() => done());
        });
    })
});
