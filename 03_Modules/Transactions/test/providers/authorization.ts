import { Authorization } from "@citrineos/data";
import { UpdateFunction } from "../shared";

export const givenAnyAuthorization = (
  updateFunction?: UpdateFunction<Authorization>
): Authorization => {
  let item: Authorization = {
    // todo
  } as Authorization;

  if (!!updateFunction) {
    updateFunction(item);
  }

  return item;
};
