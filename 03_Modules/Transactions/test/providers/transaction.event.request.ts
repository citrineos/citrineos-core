import {TransactionEventRequest} from "@citrineos/base";
import {UpdateFunction} from "../shared";

export const givenAnyTransactionEventRequest = (
    updateFunction?: UpdateFunction<TransactionEventRequest>
): TransactionEventRequest => {
    let item: TransactionEventRequest = {
        // todo
    } as TransactionEventRequest;

    if (!!updateFunction) {
        updateFunction(item);
    }

    return item;
};
