import { Glue42Core } from "../../../../glue";

export function convertInfoToInstance(info: any) {
    if (typeof info !== "object") {
        info = {};
    }

    return {
        application: info.ApplicationName,
        environment: info.Environment,
        machine: info.MachineName,
        pid: info.ProcessId,
        region: info.Region,
        service: info.ServiceName,
        user: info.UserName,
        started: info.ProcessStartTime,
    };
}

export function isStreamingFlagSet(flags: number): boolean {
    if (typeof flags !== "number" || isNaN(flags)) {
        return false;
    }

    // checking the largest Bit using bitwise ops
    const mask = 32;
    // tslint:disable-next-line:no-bitwise
    const result = flags & mask;

    return result === mask;
}

export function convertInstance(instance: Glue42Core.AGM.Instance): any {
    return {
        ApplicationName: instance.application,
        ProcessId: instance.pid,
        MachineName: instance.machine,
        UserName: instance.user,
        Environment: instance.environment,
        Region: instance.region,
    };
}
