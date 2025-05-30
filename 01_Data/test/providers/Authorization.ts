import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { Authorization, IdToken, AdditionalInfo, IdTokenInfo } from '../../src';

export function aAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  return applyUpdateFunction(
    {
      customData: { exampleKey: faker.lorem.word() },
      idToken: aIdToken(),
      idTokenInfo: aIdTokenInfo(),
    } as Authorization,
    updateFunction,
  );
}

export function aIdToken(updateFunction?: UpdateFunction<IdToken>): IdToken {
  return applyUpdateFunction(
    {
      idToken: faker.string.uuid(),
      type: 'Central',
      customData: { key: faker.lorem.word() },
      additionalInfo: [...[aAdditionalInfo()]],
    } as IdToken,
    updateFunction,
  );
}

const locales = ['en', 'es', 'fr', 'de', 'it', 'nl'];

export function aIdTokenInfo(updateFunction?: UpdateFunction<IdTokenInfo>): IdTokenInfo {
  return applyUpdateFunction(
    {
      status: 'Accepted',
      cacheExpiryDateTime: faker.date.future().toISOString(),
      chargingPriority: faker.number.int({ min: 1, max: 5 }),
      language1: faker.helpers.arrayElement(locales),
      evseId: [...[faker.number.int({ min: 1, max: 5 })]],
      groupIdToken: faker.helpers.maybe(() => aIdToken(), { probability: 0.6 }),
      language2: faker.helpers.arrayElement(locales),
      personalMessage: {
        customData: { message: faker.lorem.sentence() },
        content: faker.lorem.sentence(),
        format: 'UTF8',
      },
      customData: { customKey: faker.lorem.word() },
    } as IdTokenInfo,
    updateFunction,
  );
}

export function aAdditionalInfo(): AdditionalInfo {
  return {
    customData: faker.helpers.maybe(() => ({ key: faker.lorem.word() }), { probability: 0.8 }),
    additionalIdToken: faker.string.uuid(),
    type: 'Central',
  } as AdditionalInfo;
}
