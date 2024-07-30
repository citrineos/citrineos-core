import { UpdateFunction } from './update';
import { IdToken } from '@citrineos/data';
import { IdTokenEnumType, IdTokenType } from '@citrineos/base';
import { faker } from '@faker-js/faker';

export const aValidIdToken = (
  updateFunction?: UpdateFunction<IdToken>,
): IdTokenType => {
  const item: IdToken = {
    idToken: faker.string.uuid(),
    type: IdTokenEnumType.Central,
  } as IdToken;

  if (updateFunction) {
    updateFunction(item);
  }

  return item;
};
