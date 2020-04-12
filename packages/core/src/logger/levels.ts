export default class LogLevel {
    public static off: string = "off";
    public static trace: string = "trace";
    public static debug: string = "debug";
    public static info: string = "info";
    public static warn: string = "warn";
    public static error: string = "error";

    public static order = [LogLevel.trace, LogLevel.debug, LogLevel.info, LogLevel.warn, LogLevel.error, LogLevel.off];

    public static canPublish(level: string, restriction: string): boolean {
        const levelIdx = LogLevel.order.indexOf(level);
        const restrictionIdx = LogLevel.order.indexOf(restriction);

        return levelIdx >= restrictionIdx;
    }
}
