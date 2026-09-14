// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ResourceType } from '@lib/utils/access-types';

export const resources = [
  {
    name: ResourceType.AUTHORIZATIONS,
    list: '/authorizations',
    create: '/authorizations/new',
    show: '/authorizations/:id',
    edit: '/authorizations/:id/edit',
    meta: { canDelete: false },
  },
  {
    name: ResourceType.CHARGING_STATIONS,
    list: '/charging-stations',
    create: '/charging-stations/new',
    show: '/charging-stations/:id',
    edit: '/charging-stations/:id/edit',
  },
  {
    name: ResourceType.LOCATIONS,
    list: '/locations',
    create: '/locations/new',
    show: '/locations/:id',
    edit: '/locations/:id/edit',
  },
  {
    name: ResourceType.PARTNERS,
    list: '/partners',
    create: '/partners/new',
    show: '/partners/:id',
    edit: '/partners/:id/edit',
  },
  {
    name: ResourceType.TRANSACTIONS,
    list: '/transactions',
    show: '/transactions/:id',
    meta: {
      canDelete: true,
    },
  },
  {
    name: ResourceType.TARIFFS,
    list: '/tariffs',
    create: '/tariffs/new',
    show: '/tariffs/:id',
    edit: '/tariffs/:id/edit',
    meta: {
      canDelete: true,
    },
  },
];
