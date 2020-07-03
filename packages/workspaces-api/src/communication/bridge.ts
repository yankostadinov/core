import { CallbackRegistry } from "callback-registry";
import { SubscriptionConfig, ActiveSubscription } from "../types/subscription";
import { STREAMS } from "./constants";
import { OPERATIONS } from "./constants";
import { streamRequestArgumentsDecoder, streamActionDecoder } from "../shared/decoders";
import { Unsubscribe } from "../../workspaces";
import { InteropTransport } from "./interop-transport";
import { Instance } from "../types/glue";

export class Bridge {

    private readonly activeSubscriptions: ActiveSubscription[] = [];

    constructor(
        private readonly transport: InteropTransport,
        private readonly registry: CallbackRegistry
    ) { }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async send<T>(operationName: string, operationArgs?: any, target?: Instance): Promise<T> {

        if (!window.glue42gd && !target) {
            throw new Error(`Cannot complete operation: ${operationName} with args: ${JSON.stringify(operationArgs)}, because the environment is Glue42 Core and no frame target was provided`);
        }

        const operationDefinition = Object.values(OPERATIONS).find((operation) => operation.name === operationName);

        if (!operationDefinition) {
            throw new Error(`Cannot find definition for operation name: ${operationName}`);
        }

        if (operationDefinition.argsDecoder) {
            try {
                operationDefinition.argsDecoder.runWithException(operationArgs);
            } catch (error) {
                throw new Error(`Unexpected internal outgoing validation error: ${error.message}, for input: ${JSON.stringify(error.input)}`);
            }
        }

        let operationResult;

        try {
            const operationResultRaw = await this.transport.transmitControl(operationDefinition.name, operationArgs, target);
            operationResult = operationDefinition.resultDecoder.runWithException(operationResultRaw);
        } catch (error) {
            if (error.kind) {
                // tslint:disable-next-line: no-console
                console.log("Pre exception", operationName, operationArgs);
                throw new Error(`Unexpected internal incoming validation error: ${error.message}, for input: ${JSON.stringify(error.input)}`);
            }
            throw new Error(error.message);
        }

        return operationResult;
    }

    public async subscribe(config: SubscriptionConfig): Promise<Unsubscribe> {
        let activeSub = this.getActiveSubscription(config);
        const registryKey = this.getRegistryKey(config);

        if (!activeSub) {
            // tslint:disable-next-line: no-console
            console.log("no active sub will subscribe", config);
            const stream = STREAMS[config.streamType];
            const gdSub = await this.transport.subscribe(stream.name, this.getBranchKey(config), config.streamType);

            gdSub.onData((streamData) => {
                // tslint:disable-next-line: no-console
                console.log("received from stream", streamData);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = streamData.data as { action: string; payload: any };

                // important to decode without exception, because we do not want to throw an exception here
                const requestedArgumentsResult = streamRequestArgumentsDecoder.run(streamData.requestArguments);
                const actionResult = streamActionDecoder.run(data.action);

                if (!requestedArgumentsResult.ok || !actionResult.ok) {
                    // todo: think about what to do if data is not valid here?
                    // tslint:disable-next-line: no-console
                    console.log("the requested arguments weren't ok", streamData, requestedArgumentsResult, actionResult);
                    return;
                }

                const streamType = requestedArgumentsResult.result.type;
                const branch = requestedArgumentsResult.result.branch;

                const validatedPayload = STREAMS[streamType].payloadDecoder.run(data.payload);

                if (!validatedPayload.ok) {
                    // todo: think about what to do if data is not valid here?
                    // tslint:disable-next-line: no-console
                    console.log("the payload wasn't ok", streamData, validatedPayload);
                    return;
                }

                const keyToExecute = `${streamType}-${branch}-${actionResult.result}`;
                // tslint:disable-next-line: no-console
                console.log("will execute callback", keyToExecute);
                this.registry.execute(keyToExecute, validatedPayload.result);
            });

            activeSub = {
                streamType: config.streamType,
                level: config.level,
                levelId: config.levelId,
                callbacksCount: 0,
                gdSub
            };

            this.activeSubscriptions.push(activeSub);
        }

        const unsubscribe = this.registry.add(registryKey, config.callback);

        ++activeSub.callbacksCount;

        return (): void => {
            unsubscribe();

            --activeSub.callbacksCount;

            if (activeSub.callbacksCount === 0) {
                activeSub.gdSub.close();
                this.activeSubscriptions.splice(this.activeSubscriptions.indexOf(activeSub), 1);
            }
        };
    }

    private getBranchKey(config: SubscriptionConfig): string {
        return config.level === "global" ? config.level : `${config.level}_${config.levelId}`;
    }

    private getRegistryKey(config: SubscriptionConfig): string {
        return `${config.streamType}-${this.getBranchKey(config)}-${config.action}`;
    }

    private getActiveSubscription(config: SubscriptionConfig): ActiveSubscription {
        return this.activeSubscriptions
            .find((activeSub) => activeSub.streamType === config.streamType &&
                activeSub.level === config.level &&
                activeSub.levelId === config.levelId
            );
    }
}
