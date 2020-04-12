export default class Utils {
    public static getGDMajorVersion() {
        if (typeof window === "undefined") {
            return -1;
        }
        if (!window.glueDesktop) {
            return -1;
        }
        if (!window.glueDesktop.version) {
            return -1;
        }
        const ver = Number(window.glueDesktop.version.substr(0, 1));
        return isNaN(ver) ? -1 : ver;
    }
    public static isNode() {
        if (typeof Utils._isNode !== "undefined") {
            return Utils._isNode;
        }
        // Only Node.JS has a process variable that is of [[Class]] process
        try {
            Utils._isNode = Object.prototype.toString.call(global.process) === "[object process]";
        } catch (e) {
            Utils._isNode = false;
        }
        return Utils._isNode;
    }
    private static _isNode?: boolean;

}
