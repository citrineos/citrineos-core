import { IdToken } from '@citrineos/data';
import { IdTokenEnumType, IdTokenType } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export const aValidIdToken = (
  updateFunction?: UpdateFunction<IdToken>,
): IdTokenType => {
  const item: IdToken = {
    idToken: faker.string.uuid(),
    type: IdTokenEnumType.Central,
  } as IdToken;

  return applyUpdateFunction(item, updateFunction);
};
