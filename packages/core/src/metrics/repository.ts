import { Glue42Core } from "../../glue";
import system from "./system";
import { LocalConfig, Protocol } from "./types";

export default function repository(options: LocalConfig, protocol: Protocol): Glue42Core.Metrics.Repository {

    if (!options.identity) {
        throw new Error("Identity missing from metrics configuration");
    }

    if (!options.identity.service || typeof options.identity.service !== "string") {
        throw new Error("Service missing or invalid in metrics identity configuration");
    }

    if (!options.identity.system || typeof options.identity.system !== "string") {
        throw new Error("System missing or invalid in metrics identity configuration");
    }

    if (!options.identity.instance || typeof options.identity.instance !== "string") {
        throw new Error("Instance missing or invalid in metrics identity configuration");
    }

    const identity: Glue42Core.Metrics.Identity = options.identity;

    const instance: string = `${options.identity.system}/${options.identity.service}/${options.identity.instance}`;

    function _initSystemMetrics(rootSystem: Glue42Core.Metrics.System, useClickStream: any) {
        // Create some system metrics
        if (typeof navigator !== "undefined") {
            rootSystem.stringMetric("UserAgent", navigator.userAgent);
        }

        if (useClickStream && typeof document !== "undefined") {
            const clickStream: Glue42Core.Metrics.System = rootSystem.subSystem("ClickStream");

            const documentClickHandler = (e: Event) => {
                if (!e.target) {
                    return;
                }
                const target = e.target as HTMLAnchorElement;
                clickStream.objectMetric("LastBrowserEvent", {
                    type: "click",
                    timestamp: new Date(),
                    target: {
                        className: e.target ? target.className : "",
                        id: target.id,
                        type: "<" + target.tagName.toLowerCase() + ">",
                        href: target.href || "",
                    },
                });
            };

            // Create click stream record
            clickStream.objectMetric("Page", {
                title: document.title,
                page: window.location.href,
            });

            if (document.addEventListener) {
                document.addEventListener("click", documentClickHandler);
            } else {
                // For IE versions prior to IE9, attachEvent method should be used to register the specified listener
                // to the EventTarget it is called on, for others addEventListener should be used.
                // (<any>document)
                (document as any).attachEvent("onclick", documentClickHandler);
            }
        }

        const startTime = rootSystem.stringMetric("StartTime", (new Date()).toString());
        const urlMetric = rootSystem.stringMetric("StartURL", "");
        const appNameMetric = rootSystem.stringMetric("AppName", "");
        if (typeof window !== "undefined") {
            if (typeof window.location !== "undefined") {
                const startUrl = window.location.href;
                urlMetric.update(startUrl);
            }

            if (typeof window.glue42gd !== "undefined") {
                appNameMetric.update(window.glue42gd.appName);
            }
        }
    }
    let _root: Glue42Core.Metrics.System;
    const me: Glue42Core.Metrics.Repository = {
        identity,
        instance,

        get root() {
            return _root;
        },
    };

    protocol.init(me);
    _root = system("", me, protocol);

    _initSystemMetrics(_root, options.clickStream || options.clickStream === undefined);

    return me;
}
