// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { type AuthorizationDto, AuthorizationProps } from '@citrineos/base';
import { Badge } from '@lib/client/components/ui/badge';
import type { CrudFilter } from '@refinedev/core';
import type { ColumnConfiguration } from '@lib/utils/column.configuration';
import { TableCellLink } from '@lib/client/components/table-cell-link';
import type { CellContext } from '@tanstack/react-table';
import { isEmpty } from '@lib/utils/assertion';
import { EMPTY_VALUE } from '@lib/utils/consts';
import { badgeListStyle } from '@lib/client/styles/page';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';

type TranslateFn = (key: string, options?: any) => string;

// English fallbacks used when the columns are built without a translator
// (e.g. shared usage from areas that have not been wired to useTranslate yet).
const englishFallbacks: Record<string, string> = {
  'Authorizations.columns.authorizationId': 'Authorization ID',
  'Authorizations.columns.type': 'Type',
  'Authorizations.columns.status': 'Status',
  'Authorizations.columns.concurrentTransactions': 'Concurrent Transactions',
  'Authorizations.columns.allowedTypes': 'Allowed Types',
  'Authorizations.columns.disallowedPrefixes': 'Disallowed Prefixes',
  'Authorizations.columns.createdAt': 'Created At',
  'Authorizations.columns.updatedAt': 'Updated At',
  'Authorizations.noId': 'No ID',
  'Authorizations.allowed': 'Allowed',
  'Authorizations.notAllowed': 'Not Allowed',
};

const identityTranslate: TranslateFn = (key, options) =>
  options?.fallback ?? englishFallbacks[key] ?? key;

export const getAuthorizationsColumns = (
  translate: TranslateFn = identityTranslate,
): ColumnConfiguration[] => [
  {
    key: AuthorizationProps.idToken,
    header: translate('Authorizations.columns.authorizationId'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<AuthorizationDto, unknown>) => (
      <TableCellLink
        path={`/${MenuSection.AUTHORIZATIONS}/${row.original.id}`}
        value={row.original.idToken?.trim() ?? translate('Authorizations.noId')}
      />
    ),
  },
  {
    key: AuthorizationProps.idTokenType,
    header: translate('Authorizations.columns.type'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<AuthorizationDto, unknown>) => (
      <Badge>{row.original.idTokenType}</Badge>
    ),
  },
  {
    key: AuthorizationProps.status,
    header: translate('Authorizations.columns.status'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<AuthorizationDto, unknown>) => (
      <Badge>{row.original.status}</Badge>
    ),
  },
  {
    key: AuthorizationProps.concurrentTransaction,
    header: translate('Authorizations.columns.concurrentTransactions'),
    visible: true,
    cellRender: ({ row }: CellContext<AuthorizationDto, unknown>) => {
      const concurrentTransaction = row.original.concurrentTransaction;
      return (
        <Badge variant={concurrentTransaction ? 'success' : 'destructive'}>
          {concurrentTransaction
            ? translate('Authorizations.allowed')
            : translate('Authorizations.notAllowed')}
        </Badge>
      );
    },
  },
  {
    key: AuthorizationProps.allowedConnectorTypes,
    header: translate('Authorizations.columns.allowedTypes'),
    visible: false,
    cellRender: ({ row }: CellContext<AuthorizationDto, unknown>) =>
      !isEmpty(row.original.allowedConnectorTypes) ? (
        <div className={badgeListStyle}>
          {row.original.allowedConnectorTypes.map((connectorType: string) => (
            <Badge variant="muted" key={connectorType}>
              {connectorType}
            </Badge>
          ))}
        </div>
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: AuthorizationProps.disallowedEvseIdPrefixes,
    header: translate('Authorizations.columns.disallowedPrefixes'),
    visible: false,
    cellRender: ({ row }: CellContext<AuthorizationDto, unknown>) =>
      !isEmpty(row.original.disallowedEvseIdPrefixes) ? (
        <div className={badgeListStyle}>
          {row.original.disallowedEvseIdPrefixes.map((prefix: string) => (
            <Badge variant="muted" key={prefix}>
              {prefix}
            </Badge>
          ))}
        </div>
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: AuthorizationProps.createdAt,
    header: translate('Authorizations.columns.createdAt'),
    visible: false,
    sortable: true,
    cellRender: ({ row }: CellContext<AuthorizationDto, unknown>) =>
      row.original.createdAt ? (
        <TimestampDisplay isoTimestamp={row.original.createdAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: AuthorizationProps.updatedAt,
    header: translate('Authorizations.columns.updatedAt'),
    visible: false,
    sortable: true,
    cellRender: ({ row }: CellContext<AuthorizationDto, unknown>) =>
      row.original.updatedAt ? (
        <TimestampDisplay isoTimestamp={row.original.updatedAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
];

export const getAuthorizationFilters = (value: string): CrudFilter[] => {
  return [
    {
      operator: 'or',
      value: [
        {
          field: `${AuthorizationProps.idToken}`,
          operator: 'contains',
          value,
        },
        {
          field: `${AuthorizationProps.idTokenType}`,
          operator: 'contains',
          value,
        },
      ],
    },
  ];
};
