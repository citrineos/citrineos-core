import { Authorization } from '@citrineos/data';
import { UpdateFunction } from './update';
import { faker } from '@faker-js/faker';
import { aValidIdToken } from './idToken';
import { aValidIdTokenInfo } from './idTokenInfo';

export const aValidAuthorization = (
  updateFunction?: UpdateFunction<Authorization>,
): Authorization => {
  const item: Authorization = {
    idTokenId: faker.number.int({ min: 1, max: 100 }),
    idToken: aValidIdToken(),
    idTokenInfoId: faker.number.int({ min: 1, max: 100 }),
    idTokenInfo: aValidIdTokenInfo(),
  } as Authorization;

  if (updateFunction) {
    updateFunction(item);
  }

  return item;
};
