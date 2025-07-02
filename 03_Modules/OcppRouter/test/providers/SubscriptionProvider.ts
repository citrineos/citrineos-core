import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { Subscription } from '@citrineos/data';
import { faker } from '@faker-js/faker';

export function aSubscription(override?: Partial<Subscription>): Subscription {
  return {
    tenantId: DEFAULT_TENANT_ID,
    stationId: faker.string.uuid(),
    onConnect: true,
    onClose: true,
    onMessage: true,
    sentMessage: true,
    messageRegexFilter: 'CostUpdated',
    url: faker.internet.url(),
    ...override,
  } as Subscription;
}
