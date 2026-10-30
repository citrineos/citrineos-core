// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from 'vitest';
import { asListSubscription } from './live-subscription';

const options = (params: Parameters<typeof asListSubscription>[0]['params']) => ({
  channel: 'resources/Transactions',
  types: ['*'],
  callback: vi.fn(),
  params,
});

describe('asListSubscription', () => {
  it('turns a useOne subscription into a list subscription filtered on its id', () => {
    const original = options({ resource: 'Transactions', subscriptionType: 'useOne', id: 42 });

    const converted = asListSubscription(original);

    expect(converted.params).toEqual({
      resource: 'Transactions',
      subscriptionType: 'useList',
      id: 42,
      filters: [{ field: 'id', operator: 'eq', value: 42 }],
    });
    expect(converted.callback).toBe(original.callback);
    expect(converted.channel).toBe(original.channel);
  });

  it('leaves a useOne subscription without an id unchanged', () => {
    const original = options({ resource: 'Transactions', subscriptionType: 'useOne' });

    expect(asListSubscription(original)).toBe(original);
  });

  it('leaves list subscriptions unchanged', () => {
    const original = options({
      resource: 'Transactions',
      subscriptionType: 'useList',
      filters: [{ field: 'isActive', operator: 'eq', value: true }],
    });

    expect(asListSubscription(original)).toBe(original);
  });
});
