describe('addColumn() Should ', function () {
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
        expect(workspace.addColumn().then).to.be.a("function");;
        expect(workspace.addColumn().catch).to.be.a("function");;
    });

    it("resolve", async () => {
        await workspace.addColumn();
    });

    it("resolve with a column", async () => {
        const column = await workspace.addColumn();

        expect(column.constructor.name).to.eql("Column");
    });

    Array.from({ length: 5 }).forEach((_, i) => {
        it(`add ${i + 1} empty column/s to the workspace`, async () => {

            const columns = await Promise.all(Array.from({ length: i + 1 }).map(() => {
                return workspace.addColumn();
            }))

            const columnChildren = columns.reduce((acc, r) => [...acc, ...r.getAllChildren()], []);

            await workspace.refreshReference();
            const allColumns = workspace.getAllColumns();
            console.log(columnChildren);
            expect(allColumns.length).to.eql(i + 1);
            expect(columnChildren.length).to.eql(0);
        });
    });

    describe("", () => {
        // Not focused

        beforeEach(async () => {
            await glue.workspaces.createWorkspace(basicConfig);
        });

        it("return a promise when the workspace is not focused", () => {
            expect(workspace.addColumn().then).to.be.a("function");;
            expect(workspace.addColumn().catch).to.be.a("function");;
        });

        it("resolve when the workspace is not focused", async () => {
            await workspace.addColumn();
        });

        it("resolve with a column when the workspace is not focused", async () => {
            const column = await workspace.addColumn();

            expect(column.constructor.name).to.eql("Column");
        });

        Array.from({ length: 5 }).forEach((_, i) => {
            it(`add ${i + 1} column/s to the workspace when the workspace is not focused`, async () => {

                await Promise.all(Array.from({ length: i + 1 }).map(() => {
                    return workspace.addColumn();
                }))

                await workspace.refreshReference();
                const allColumns = workspace.getAllColumns();
                expect(allColumns.length).to.eql(i + 1);
            });

            it(`add ${i + 1} empty column/s to the workspace when the workspace is not focused`, async () => {

                const columns = await Promise.all(Array.from({ length: i + 1 }).map(() => {
                    return workspace.addColumn();
                }))

                const columnChildren = columns.reduce((acc, r) => [...acc, ...r.getAllChildren()], []);

                await workspace.refreshReference();
                const allColumns = workspace.getAllColumns();
                console.log(columnChildren);
                expect(allColumns.length).to.eql(i + 1);
                expect(columnChildren.length).to.eql(0);
            });
        });
    });

    // TODO add tests with config
    Array.from([42, []]).forEach((input) => {
        it(`reject when the input is ${JSON.stringify(input)}`, (done) => {
            workspace.addColumn(input).then(() => {
                done("Should not resolve");
            }).catch(() => done());
        });
    })
});
