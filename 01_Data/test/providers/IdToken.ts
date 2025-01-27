import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { AdditionalInfo, IdToken } from '../../src';

export function aIdToken(updateFunction?: UpdateFunction<IdToken>): IdToken {
  const idToken: IdToken = {
    idToken: faker.string.alpha(10),
    type: 'Central',
    additionalInfo: [...[anAdditionalInfo()]],
    customData: { vendorId: faker.string.alpha(10) },
  } as IdToken;

  return applyUpdateFunction(idToken, updateFunction);
}

export function anAdditionalInfo(updateFunction?: UpdateFunction<AdditionalInfo>): AdditionalInfo {
  const additionalInfo: AdditionalInfo = {
    additionalIdToken: faker.string.alpha(10),
    type: 'ISO15693',
  } as AdditionalInfo;

  return applyUpdateFunction(additionalInfo, updateFunction);
}
