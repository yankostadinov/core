import { RemoteStore } from "../types";
import { Glue42Web } from "../../../web";

export class JSONStore implements RemoteStore {

    constructor(private readonly storeBaseUrl: string) { }

    public async getAll(layoutType: Glue42Web.Layouts.LayoutType): Promise<Glue42Web.Layouts.Layout[]> {

        if (layoutType === "Global") {
            return [];
        }

        const fetchUrl = `${this.storeBaseUrl}/glue.workspaces.json`;
        // const fetchUrl = layoutType === "Global" ?
        //     `${this.storeBaseUrl}/glue.layouts.json` :
        //     `${this.storeBaseUrl}/glue.workspaces.json`;

        const response = await this.fetchTimeout(fetchUrl);

        if (!response.ok) {
            return [];
        }

        const layouts = await response.json();

        // todo: validate the layouts, warn and discard invalid ones

        return layouts || [];
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
