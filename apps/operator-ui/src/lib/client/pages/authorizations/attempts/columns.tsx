// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import {
  AuthorizationAttemptProps,
  AuthorizationAttemptReasonSchema,
  AuthorizationStatusEnum,
  ChargingStationProps,
  IdTokenEnum,
  OCPP_CallAction,
} from '@citrineos/types';
import { MenuSection } from '@lib/client/components/main-menu/main-menu';
import { TableCellLink } from '@lib/client/components/table-cell-link';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import { Badge } from '@lib/client/components/ui/badge';
import { AuthorizationAttemptClass } from '@lib/cls/authorization-attempt-dto';
import type { ColumnConfiguration } from '@lib/utils/column-configuration';
import { EMPTY_VALUE } from '@lib/utils/consts';
import { chargingStationPath } from '@lib/utils/resource-paths';
import type { CrudFilters } from '@refinedev/core';
import type { CellContext } from '@tanstack/react-table';

type TranslateFn = (key: string, options?: any) => string;

export const authorizationAttemptStationIdField = `ChargingStation.${ChargingStationProps.ocppConnectionName}`;

/**
 * Attempts linked to no Authorization, apart from NoAuthorization idTokens, which never have one.
 * OCPP 1.6 idTags carry no type, and a NULL type fails `_neq`, so it is matched on its own.
 */
export const unmatchedAttemptsFilter: CrudFilters = [
  { field: AuthorizationAttemptProps.authorizationId, operator: 'null', value: true },
  {
    key: 'unmatchedTokenType',
    operator: 'or',
    value: [
      { field: AuthorizationAttemptProps.idTokenType, operator: 'null', value: true },
      {
        field: AuthorizationAttemptProps.idTokenType,
        operator: 'ne',
        value: IdTokenEnum.NoAuthorization,
      },
    ],
  },
];

const ATTEMPT_ACTIONS = [
  OCPP_CallAction.Authorize,
  OCPP_CallAction.StartTransaction,
  OCPP_CallAction.StopTransaction,
  OCPP_CallAction.TransactionEvent,
  OCPP_CallAction.RemoteStartTransaction,
  OCPP_CallAction.RequestStartTransaction,
];

const toEnumOptions = (values: readonly string[]) =>
  values.map((value) => ({ label: value, value }));

const formatDetails = (details: AuthorizationAttemptClass['details']): string => {
  if (!details) {
    return EMPTY_VALUE;
  }
  const parts = Object.entries(details)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  return parts.length > 0 ? parts.join(' · ') : EMPTY_VALUE;
};

const timestampCell = (value?: string | Date | null) =>
  value ? <TimestampDisplay isoTimestamp={value} /> : <span>{EMPTY_VALUE}</span>;

/**
 * @param options.forAuthorization leaves out the columns that would repeat the Authorization
 * being viewed, for the tab on its detail page.
 */
export const getAuthorizationAttemptsColumns = (
  translate: TranslateFn,
  options: { forAuthorization?: boolean } = {},
): ColumnConfiguration[] => {
  const columns: (ColumnConfiguration & { listOnly?: boolean })[] = [
    {
      key: AuthorizationAttemptProps.timestamp,
      header: translate('AuthorizationAttempts.columns.timestamp'),
      visible: true,
      sortable: true,
      filterConfig: { type: 'date' },
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) =>
        timestampCell(row.original.timestamp),
    },
    {
      key: AuthorizationAttemptProps.action,
      header: translate('AuthorizationAttempts.columns.action'),
      visible: true,
      sortable: true,
      filterConfig: { type: 'enum', enumOptions: toEnumOptions(ATTEMPT_ACTIONS) },
    },
    {
      key: AuthorizationAttemptProps.idToken,
      header: translate('AuthorizationAttempts.columns.idToken'),
      visible: true,
      sortable: true,
      listOnly: true,
      filterConfig: { type: 'text' },
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) => (
        <span>{row.original.idToken || EMPTY_VALUE}</span>
      ),
    },
    {
      key: AuthorizationAttemptProps.idTokenType,
      header: translate('AuthorizationAttempts.columns.idTokenType'),
      visible: false,
      sortable: true,
      listOnly: true,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) =>
        row.original.idTokenType ? (
          <Badge>{row.original.idTokenType}</Badge>
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: AuthorizationAttemptProps.authorizationId,
      header: translate('AuthorizationAttempts.columns.authorization'),
      visible: true,
      listOnly: true,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) =>
        row.original.authorization ? (
          <TableCellLink
            path={`/${MenuSection.AUTHORIZATIONS}/${row.original.authorization.id}`}
            value={row.original.authorization.idToken}
          />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: authorizationAttemptStationIdField,
      header: translate('AuthorizationAttempts.columns.station'),
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) =>
        row.original.station?.ocppConnectionName ? (
          <TableCellLink
            path={chargingStationPath(row.original.station.ocppConnectionName)}
            value={row.original.station.ocppConnectionName}
          />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: AuthorizationAttemptProps.evseId,
      header: translate('AuthorizationAttempts.columns.evse'),
      visible: false,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) => (
        <span>{row.original.evseId ?? EMPTY_VALUE}</span>
      ),
    },
    {
      key: AuthorizationAttemptProps.connectorId,
      header: translate('AuthorizationAttempts.columns.connector'),
      visible: false,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) => (
        <span>{row.original.connectorId ?? EMPTY_VALUE}</span>
      ),
    },
    {
      key: AuthorizationAttemptProps.responseStatus,
      header: translate('AuthorizationAttempts.columns.responseStatus'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) =>
        row.original.responseStatus ? (
          <Badge
            variant={
              row.original.responseStatus === AuthorizationStatusEnum.Accepted
                ? 'success'
                : 'destructive'
            }
          >
            {row.original.responseStatus}
          </Badge>
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: AuthorizationAttemptProps.reason,
      header: translate('AuthorizationAttempts.columns.reason'),
      visible: true,
      sortable: true,
      filterConfig: {
        type: 'enum',
        enumOptions: toEnumOptions(AuthorizationAttemptReasonSchema.options),
      },
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) =>
        row.original.reason ? (
          <Badge variant="outline">{row.original.reason}</Badge>
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: AuthorizationAttemptProps.storedStatus,
      header: translate('AuthorizationAttempts.columns.storedStatus'),
      visible: false,
      sortable: true,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) =>
        row.original.storedStatus ? (
          <Badge variant="muted">{row.original.storedStatus}</Badge>
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: AuthorizationAttemptProps.transactionId,
      header: translate('AuthorizationAttempts.columns.transaction'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) => {
        const { transactionDatabaseId, transactionId } = row.original;
        if (transactionDatabaseId != null) {
          return (
            <TableCellLink
              path={`/${MenuSection.TRANSACTIONS}/${transactionDatabaseId}`}
              value={transactionId ?? String(transactionDatabaseId)}
            />
          );
        }
        return <span>{transactionId ?? EMPTY_VALUE}</span>;
      },
    },
    {
      key: AuthorizationAttemptProps.remoteStartId,
      header: translate('AuthorizationAttempts.columns.remoteStartId'),
      visible: false,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) => (
        <span>{row.original.remoteStartId ?? EMPTY_VALUE}</span>
      ),
    },
    {
      key: AuthorizationAttemptProps.details,
      header: translate('AuthorizationAttempts.columns.details'),
      visible: true,
      cellRender: ({ row }: CellContext<AuthorizationAttemptClass, unknown>) => (
        <span>{formatDetails(row.original.details)}</span>
      ),
    },
    {
      key: AuthorizationAttemptProps.ocppVersion,
      header: translate('AuthorizationAttempts.columns.ocppVersion'),
      visible: false,
      sortable: true,
    },
    {
      key: AuthorizationAttemptProps.correlationId,
      header: translate('AuthorizationAttempts.columns.correlationId'),
      visible: false,
      filterConfig: { type: 'text' },
    },
  ];

  return columns
    .filter((column) => !(options.forAuthorization && column.listOnly))
    .map(({ listOnly: _, ...column }) => column);
};

export const getAuthorizationAttemptsFilters = (value: string): CrudFilters => [
  {
    operator: 'or',
    value: [
      { field: AuthorizationAttemptProps.idToken, operator: 'contains', value },
      { field: authorizationAttemptStationIdField, operator: 'contains', value },
      { field: AuthorizationAttemptProps.transactionId, operator: 'contains', value },
    ],
  },
];
