// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { SubscriptionDto } from '@citrineos/types';
import { faker } from '@faker-js/faker';

export function aSubscription(override?: Partial<SubscriptionDto>): SubscriptionDto {
  return {
    tenantId: DEFAULT_TENANT_ID,
    ocppConnectionName: faker.string.uuid(),
    onConnect: true,
    onClose: true,
    onMessage: true,
    sentMessage: true,
    messageRegexFilter: 'CostUpdated',
    url: faker.internet.url(),
    ...override,
  } as SubscriptionDto;
}
