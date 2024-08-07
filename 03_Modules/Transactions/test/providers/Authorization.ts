import { Authorization } from '@citrineos/data';

import { faker } from '@faker-js/faker';
import { anIdToken } from './IdToken';
import { anIdTokenInfo } from './IdTokenInfo';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export function anAuthorization(
  updateFunction?: UpdateFunction<Authorization>,
): Authorization {
  const item: Authorization = {
    idTokenId: faker.number.int({ min: 1, max: 100 }),
    idToken: anIdToken(),
    idTokenInfoId: faker.number.int({ min: 1, max: 100 }),
    idTokenInfo: anIdTokenInfo(),
  } as Authorization;

  return applyUpdateFunction(item, updateFunction);
}
