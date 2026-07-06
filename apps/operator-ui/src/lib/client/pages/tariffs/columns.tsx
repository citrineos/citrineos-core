// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { TariffProps } from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { TableCellLink } from '@lib/client/components/table-cell-link';
import type { TariffClass } from '@lib/cls/tariff.dto';
import type { CrudFilters } from '@refinedev/core';
import type { CellContext } from '@tanstack/react-table';
import type { ColumnConfiguration } from '@lib/utils/column.configuration';
import { EMPTY_VALUE } from '@lib/utils/consts';

type TranslateFn = (key: string, options?: any) => string;

const identityTranslate: TranslateFn = (key, options) => options?.fallback ?? key;

export const getTariffsColumns = (
  translate: TranslateFn = identityTranslate,
): ColumnConfiguration[] => [
  {
    key: TariffProps.id,
    header: translate('Tariffs.columns.id'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<TariffClass, unknown>) => (
      <TableCellLink path={`/${MenuSection.TARIFFS}/${row.original.id}`} value={row.original.id} />
    ),
  },
  {
    key: TariffProps.currency,
    header: translate('Tariffs.columns.currency'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<TariffClass, unknown>) => (
      <span>{row.original.currency}</span>
    ),
  },
  {
    key: TariffProps.pricePerKwh,
    header: translate('Tariffs.columns.pricePerKwh'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<TariffClass, unknown>) => (
      <span>{row.original.pricePerKwh?.toFixed(2)}</span>
    ),
  },
  {
    key: TariffProps.pricePerMin,
    header: translate('Tariffs.columns.pricePerMin'),
    visible: true,
    cellRender: ({ row }: CellContext<TariffClass, unknown>) => (
      <span>
        {row.original.pricePerMin != null ? row.original.pricePerMin.toFixed(2) : EMPTY_VALUE}
      </span>
    ),
  },
  {
    key: TariffProps.pricePerSession,
    header: translate('Tariffs.columns.pricePerSession'),
    visible: true,
    cellRender: ({ row }: CellContext<TariffClass, unknown>) => (
      <span>
        {row.original.pricePerSession != null
          ? row.original.pricePerSession.toFixed(2)
          : EMPTY_VALUE}
      </span>
    ),
  },
];

export const getTariffsFilters = (value: string): CrudFilters => {
  return [
    {
      field: TariffProps.currency,
      operator: 'contains',
      value,
    },
  ];
};
