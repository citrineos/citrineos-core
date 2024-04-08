import { UpdateFunction } from "../shared";
import { IdTokenInfoType } from "@citrineos/base";

export const givenAnyIdTokenInfoType = (
  updateFunction?: UpdateFunction<IdTokenInfoType>
): IdTokenInfoType => {
  let item: IdTokenInfoType = {
    // todo
  } as IdTokenInfoType;

  if (!!updateFunction) {
    updateFunction(item);
  }

  return item;
};
