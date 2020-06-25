import { RemoteStore } from "../types";
import { Glue42Web } from "../../../web";

export class JSONStore implements RemoteStore {

    constructor(private readonly storeBaseUrl: string) { }

    public async getAll(layoutType: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout[]> {

        const fetchUrl = `${this.storeBaseUrl}/glue.layouts.json`;

        const response = await this.fetchTimeout(fetchUrl);

        if (!response.ok) {
            return [];
        }

        let layouts;
        try {
            layouts = await response.json();
        } catch (error) {
            return [];
        }

        if (!layouts) {
            return [];
        }
        // todo: validate the layouts, warn and discard invalid ones

        const layoutProp = layoutType === "Global" ? "globals" : "workspaces";

        return layouts[layoutProp] || [];
    }

    public async get(name: string, layoutType: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout | undefined> {

        const allLayouts = await this.getAll(layoutType);

        return allLayouts.find((layout) => layout.name === name);
    }

    private fetchTimeout(url: string, timeoutMilliseconds = 1000): Promise<Response> {
        return new Promise((resolve, reject) => {
            let timeoutHit = false;
            const timeout = setTimeout(() => {
                timeoutHit = true;
                reject(new Error(`Fetch request for: ${url} timed out at: ${timeoutMilliseconds} milliseconds`));
            }, timeoutMilliseconds);

            fetch(url)
                .then((response) => {
                    if (!timeoutHit) {
                        clearTimeout(timeout);
                        resolve(response);
                    }
                })
                .catch((err) => {
                    if (!timeoutHit) {
                        clearTimeout(timeout);
                        reject(err);
                    }
                });
        });
    }
}
