import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { Authorization, AdditionalInfo } from '../../src';

export function aAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  return applyUpdateFunction(
    {
      customData: { exampleKey: faker.lorem.word() },
      idToken: faker.string.uuid(),
      idTokenType: 'Central',
      additionalInfo: [aAdditionalInfo()],
      status: 'Accepted',
      cacheExpiryDateTime: faker.date.future().toISOString(),
      chargingPriority: faker.number.int({ min: 1, max: 5 }),
      language1: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'it', 'nl']),
      groupIdTokenId: faker.number.int({ min: 1, max: 100 }),
      language2: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'it', 'nl']),
      personalMessage: {
        customData: { message: faker.lorem.sentence() },
        content: faker.lorem.sentence(),
        format: 'UTF8',
      },
    } as Authorization,
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
