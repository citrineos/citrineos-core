import { TransactionEventResponse } from "@citrineos/base";
import { UpdateFunction } from "../shared";

export const givenAnyTransactionEventResponse = (
  updateFunction?: UpdateFunction<TransactionEventResponse>
): TransactionEventResponse => {
  let item: TransactionEventResponse = {
    // todo
  } as TransactionEventResponse;

  if (!!updateFunction) {
    updateFunction(item);
  }

  return item;
};
