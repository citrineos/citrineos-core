import {HandlerProperties, IMessage, TransactionEventRequest} from "@citrineos/base";

export interface IHandler {
    handle(message: IMessage<any>,
           props?: HandlerProperties,): Promise<any>;
}
