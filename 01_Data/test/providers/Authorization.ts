// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { Authorization } from '../../src';
import { AdditionalInfo, IdTokenType } from '@citrineos/base';

export function aAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  return applyUpdateFunction(
    {
      customData: { exampleKey: faker.lorem.word() },
      idToken: faker.string.uuid(),
      idTokenType: IdTokenType.Central,
      additionalInfo: [{ additionalIdToken: 'value', type: 'key' }] as AdditionalInfo[],
      status: 'Accepted',
      cacheExpiryDateTime: faker.date.future().toISOString(),
      chargingPriority: faker.number.int({ min: 1, max: 5 }),
      language1: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'it', 'nl']),
      groupAuthorizationId: faker.number.int({ min: 1, max: 100 }), // renamed property
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
