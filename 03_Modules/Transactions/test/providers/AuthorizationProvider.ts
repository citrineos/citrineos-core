import { Authorization } from '@citrineos/data';

import { faker } from '@faker-js/faker';
import { anIdToken } from './IdTokenProvider';
import { anIdTokenInfo } from './IdTokenInfoProvider';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { DEFAULT_TENANT_ID } from '@citrineos/base';

export function anAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  const item: Authorization = {
    tenantId: DEFAULT_TENANT_ID,
    idTokenId: faker.number.int({ min: 1, max: 100 }),
    idToken: anIdToken(),
    idTokenInfoId: faker.number.int({ min: 1, max: 100 }),
    idTokenInfo: anIdTokenInfo(),
  } as Authorization;

  return applyUpdateFunction(item, updateFunction);
}
