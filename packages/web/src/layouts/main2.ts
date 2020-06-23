import { Glue42Web } from "../../web";
import { LayoutsController } from "./controller";

export class Layouts implements Glue42Web.Layouts.API {

    constructor(private readonly controller: LayoutsController) { }

    public getLayoutNames(type: Glue42Web.Layouts.LayoutType): Promise<string[]> {
        // todo validate
        return this.controller.getLayoutNames(type);
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