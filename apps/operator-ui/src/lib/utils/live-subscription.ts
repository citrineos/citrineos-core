// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { LiveProvider } from '@refinedev/core';

type SubscribeOptions = Parameters<LiveProvider['subscribe']>[0];

/**
 * The generated useOne subscription is `<Resource>_by_pk(id:)`, which partitioned tables such as
 * Transactions (primary key createdAt + id) reject, and the Hasura provider drops the error
 * silently. A list subscription filtered on id works for every table; in auto mode the event only
 * triggers a refetch of the page's own query, so the payload shape does not matter.
 */
export const asListSubscription = (options: SubscribeOptions): SubscribeOptions =>
  options.params?.subscriptionType === 'useOne' && options.params.id !== undefined
    ? {
        ...options,
        params: {
          ...options.params,
          subscriptionType: 'useList',
          filters: [{ field: 'id', operator: 'eq', value: options.params.id }],
        },
      }
    : options;
