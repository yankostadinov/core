import { Glue42Web } from "../../web";
import { LayoutsController } from "./controller";

export class Layouts implements Glue42Web.Layouts.API {

    constructor(private readonly controller: LayoutsController) { }

    public getAll(type: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.LayoutSummary[]> {
        // todo validate
        return this.controller.getAll(type);
    }

    public get(name: string, type: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout | undefined> {
        // todo validate
        return this.controller.get(name, type);
    }

    public async export(layoutType?: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout[]> {
        // todo validate
        return this.controller.export(layoutType);
    }

    public import(layout: Glue42Web.Layouts.Layout): Promise<void> {
        // todo: validate
        return this.controller.import(layout);
    }

    public save(layout: Glue42Web.Layouts.NewLayoutOptions): Promise<Glue42Web.Layouts.Layout> {
        // todo: validate
        return this.controller.save(layout);
    }

    public restore(options: Glue42Web.Layouts.RestoreOptions): Promise<void> {
        // todo: validate
        return this.controller.restore(options);
    }

    public remove(type: Glue42Web.Layouts.LayoutType, name: string): Promise<void> {
        // todo: validate
        return this.controller.remove(type, name);
    }

}
