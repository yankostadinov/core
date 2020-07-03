import { METHODS, OPERATIONS } from "./constants";
import { NewFrameConfig } from "../../workspaces";
import { Bridge } from "./bridge";
import { FrameSummaryResult } from "../types/protocol";
import { WindowsAPI, Instance, GDWindow, InteropAPI } from "../types/glue";

export class CoreFrameUtils {

    private readonly workspacesRoute = "/glue/workspaces/index.html";
    private readonly defaultWidth = 1280;
    private readonly defaultHeight = 720;

    constructor(
        private readonly interop: InteropAPI,
        private readonly windows: WindowsAPI,
        private readonly bridge: Bridge
    ) { }

    public getAllFrameInstances(): Instance[] {
        return this.interop.servers()
            .filter((server) => {
                if (server?.getMethods) {
                    return server.getMethods()?.some((method) => method.name === METHODS.control.name);
                }
            });
    }

    public async getFrameInstance(config?: { frameId?: string; newFrame?: NewFrameConfig | boolean }): Promise<Instance> {

        if (config?.frameId && config?.newFrame) {
            throw new Error("Cannot retrieve the frame, because of over-specification: both frameId and newFrame were provided.");
        }

        const frames = this.getAllFrameInstances();

        if (config?.frameId) {
            const foundFrame = frames.find((frame) => frame.peerId === config.frameId);

            if (!foundFrame) {
                throw new Error(`Frame with id: ${config.frameId} was not found`);
            }

            return foundFrame;
        }

        if (config?.newFrame) {
            return this.openNewWorkspacesFrame(config.newFrame);
        }

        return frames.length ? this.getLastFrameInteropInstance() : this.openNewWorkspacesFrame();
    }

    public async getFrameInstanceByItemId(itemId: string): Promise<Instance> {
        const frames = this.getAllFrameInstances();

        const queryResult = await Promise.all(frames.map((frame) => this.bridge.send<FrameSummaryResult>(OPERATIONS.getFrameSummary.name, { itemId }, frame)));

        const foundFrameSummary = queryResult.find((result) => result.id !== "none");

        if (!foundFrameSummary) {
            throw new Error(`Cannot find frame for item: ${itemId}`);
        }

        const frameInstance = await this.getFrameInstance({ frameId: foundFrameSummary.id });

        return frameInstance;
    }

    public getLastFrameInteropInstance(): Instance | undefined {
        return this.getAllFrameInstances()
            .sort((a, b) => {
                const aIncrementor = a?.peerId ? +a.peerId.slice(a.peerId.lastIndexOf("-") + 1) : 0;
                const bIncrementor = b?.peerId ? +b.peerId.slice(b.peerId.lastIndexOf("-") + 1) : 0;

                return bIncrementor - aIncrementor;
            })[0];
    }

    public openNewWorkspacesFrame(newFrameConfig?: NewFrameConfig | boolean): Promise<Instance> {
        return new Promise<Instance>((resolve, reject) => {

            const framesCount = this.getAllFrameInstances().length;

            let frameWindow: GDWindow;

            const unsubscribe = this.interop.serverAdded((server) => {
                if (frameWindow?.id && frameWindow.id === server.windowId) {
                    unsubscribe();
                    resolve(server);
                }
            });

            const frameOptions = {
                url: `${this.workspacesRoute}?emptyFrame=true`,
                width: typeof newFrameConfig === "object" ? newFrameConfig.bounds?.width || this.defaultWidth : this.defaultWidth,
                height: typeof newFrameConfig === "object" ? newFrameConfig.bounds?.height || this.defaultHeight : this.defaultHeight
            };

            this.windows.open(`frame_${framesCount + 1}`, frameOptions.url, frameOptions)
                .then((frWin) => {
                    frameWindow = frWin;

                    const foundServer = this.interop.servers().find((server) => server.windowId === frameWindow.id);

                    if (foundServer) {
                        unsubscribe();
                        resolve(foundServer);
                    }
                })
                .catch(reject);
        });
    }
}