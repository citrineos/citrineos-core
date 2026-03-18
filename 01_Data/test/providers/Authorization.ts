// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AdditionalInfo } from '@citrineos/base';
import { AuthorizationStatusEnum, IdTokenEnum } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { Authorization } from '../../src';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil.js';

export function aAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  return applyUpdateFunction(
    {
      customData: { exampleKey: faker.lorem.word() },
      idToken: faker.string.uuid(),
      idTokenType: IdTokenEnum.Central,
      additionalInfo: [{ additionalIdToken: 'value', type: 'key' }] as AdditionalInfo[],
      status: AuthorizationStatusEnum.Accepted,
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
