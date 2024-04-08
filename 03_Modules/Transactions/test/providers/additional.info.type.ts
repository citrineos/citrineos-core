import { AdditionalInfoType } from "@citrineos/base";
import { UpdateFunction } from "../shared";

export const givenAnyAdditionalInfoType = (
  updateFunction?: UpdateFunction<AdditionalInfoType>
): AdditionalInfoType => {
  let item: AdditionalInfoType = {
    // todo
  } as AdditionalInfoType;

  if (!!updateFunction) {
    updateFunction(item);
  }

  return item;
};
