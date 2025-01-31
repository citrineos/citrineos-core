import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { IdTokenInfo } from '../../src';
import { aIdToken } from './IdToken';

export function aIdTokenInfo(updateFunction?: UpdateFunction<IdTokenInfo>): IdTokenInfo {
  const idTokenInfo: IdTokenInfo = {
    status: 'Accepted',
    cacheExpiryDateTime: faker.date.recent().toISOString(),
    chargingPriority: faker.number.int({ min: 0, max: 5 }),
    language1: faker.string.alpha(2),
    evseId: [faker.number.int({ min: 0, max: 5 }), ...[faker.number.int({ min: 0, max: 5 })]],
    groupIdToken: aIdToken(),
    language2: faker.string.alpha(2),
    personalMessage: {
      format: 'ASCII',
      content: faker.string.alpha(10),
    },
    customData: { vendorId: faker.string.alpha(10) },
  } as IdTokenInfo;

  return applyUpdateFunction(idTokenInfo, updateFunction);
}
