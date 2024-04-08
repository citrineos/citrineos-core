import { IdTokenEnumType, IdTokenType } from "@citrineos/base";
import { UpdateFunction } from "../shared";

export const givenAnyIdTokenType = (
  updateFunction?: UpdateFunction<IdTokenType>
): IdTokenType => {
  let item: IdTokenType = {
    idToken: "idToken",
    type: IdTokenEnumType.Local,
  } as IdTokenType;

  if (!!updateFunction) {
    updateFunction(item);
  }

  return item;
};
