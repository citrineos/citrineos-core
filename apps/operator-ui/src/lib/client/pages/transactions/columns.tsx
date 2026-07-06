// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import {
  AuthorizationProps,
  LocationProps,
  OCPP2_0_1,
  type TransactionDto,
  TransactionProps,
} from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import GenericTag from '@lib/client/components/tag';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import { CircleCheck, CircleX } from 'lucide-react';
import { buttonIconSize } from '@lib/client/styles/icon';
import type { BaseRecord, CrudFilters } from '@refinedev/core';
import { TableCellLink } from '@lib/client/components/table-cell-link';
import type { CellContext } from '@tanstack/react-table';
import type { ColumnConfiguration } from '@lib/utils/column.configuration';
import { TransactionClass } from '@lib/cls/transaction.dto';
import { EMPTY_VALUE } from '@lib/utils/consts';

export const transactionStationIdField = 'ocppConnectionName';
export const transactionChargingStationLocationNameField = 'ChargingStation.Location.name';
export const transactionAuthorizationIdTokenField = 'authorization.idToken';

type TranslateFn = (key: string, options?: any) => string;

/**
 * Builds the transactions table columns with translated headers.
 *
 * @param translate - the `useTranslate()` function. When omitted, headers fall
 *   back to their default English text so the columns can be referenced outside
 *   of a React render (e.g. shared filtering helpers in other resource pages).
 */
export const getTransactionsColumns = (translate?: TranslateFn): ColumnConfiguration[] => {
  const t = (key: string, fallback: string) => (translate ? translate(key, fallback) : fallback);

  return [
    {
      key: TransactionProps.transactionId,
      header: t('Transactions.columns.transactionId', 'Transaction ID'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<TransactionClass, unknown>) => (
        <TableCellLink
          path={`/${MenuSection.TRANSACTIONS}/${row.original.id}`}
          value={row.original.transactionId}
        />
      ),
    },
    {
      key: TransactionProps.isActive,
      header: t('Transactions.columns.active', 'Active'),
      visible: true,
      cellRender: ({ row }: CellContext<TransactionClass, unknown>) =>
        row.original.isActive ? (
          <CircleCheck className={`${buttonIconSize} text-success`} />
        ) : (
          <CircleX className={`${buttonIconSize} text-destructive`} />
        ),
    },
    {
      key: transactionStationIdField,
      header: t('Transactions.columns.stationId', 'Station ID'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<TransactionClass, unknown>) => (
        <TableCellLink
          path={`/${MenuSection.CHARGING_STATIONS}/${row.original.chargingStation?.id}`}
          value={row.original.chargingStation?.ocppConnectionName ?? EMPTY_VALUE}
        />
      ),
    },
    {
      key: transactionChargingStationLocationNameField,
      header: t('Transactions.columns.location', 'Location'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<BaseRecord, unknown>) => (
        <TableCellLink
          path={`/${MenuSection.LOCATIONS}/${row.original.chargingStation?.location?.id}`}
          value={row.original.chargingStation?.location?.name ?? EMPTY_VALUE}
        />
      ),
    },
    {
      key: transactionAuthorizationIdTokenField,
      header: t('Transactions.columns.idToken', 'ID Token'),
      visible: true,
      cellRender: ({ row }: CellContext<BaseRecord, unknown>) => {
        const idToken = row.original.authorization?.idToken;
        return idToken ? (
          <TableCellLink
            path={`/${MenuSection.AUTHORIZATIONS}/${row.original.authorization?.id}`}
            value={idToken}
          />
        ) : (
          <span>{EMPTY_VALUE}</span>
        );
      },
    },
    {
      key: TransactionProps.totalKwh,
      header: t('Transactions.columns.totalKwh', 'Total kWh'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<TransactionClass, unknown>) =>
        row.original.totalKwh ? (
          <span>{row.original.totalKwh.toFixed(2)} kWh</span>
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: 'status',
      header: t('Transactions.columns.status', 'Status'),
      visible: true,
      cellRender: ({ row }: CellContext<TransactionClass, unknown>) =>
        row.original.chargingState ? (
          <GenericTag
            enumValue={row.original.chargingState as OCPP2_0_1.ChargingStateEnumType}
            enumType={OCPP2_0_1.ChargingStateEnumType}
          />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: TransactionProps.startTime,
      header: t('Transactions.columns.startTime', 'Start Time'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<TransactionClass, unknown>) =>
        row.original.startTime ? (
          <TimestampDisplay isoTimestamp={row.original.startTime} />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: TransactionProps.endTime,
      header: t('Transactions.columns.endTime', 'End Time'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<TransactionClass, unknown>) =>
        row.original.endTime ? (
          <TimestampDisplay isoTimestamp={row.original.endTime} />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: TransactionProps.createdAt,
      header: t('Transactions.columns.createdAt', 'Created At'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<TransactionDto, unknown>) =>
        row.original.createdAt ? (
          <TimestampDisplay isoTimestamp={row.original.createdAt} />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: TransactionProps.updatedAt,
      header: t('Transactions.columns.updatedAt', 'Updated At'),
      visible: true,
      sortable: true,
      cellRender: ({ row }: CellContext<TransactionDto, unknown>) =>
        row.original.updatedAt ? (
          <TimestampDisplay isoTimestamp={row.original.updatedAt} />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
  ];
};

export const getTransactionsFilters = (value: string): CrudFilters => {
  return [
    {
      operator: 'or',
      value: [
        {
          field: TransactionProps.transactionId,
          operator: 'contains',
          value,
        },
        {
          field: `Location.${LocationProps.name}`,
          operator: 'contains',
          value,
        },
        {
          field: TransactionProps.ocppConnectionName,
          operator: 'contains',
          value,
        },
        {
          field: TransactionProps.chargingState,
          operator: 'contains',
          value,
        },
        {
          field: `Authorization.${AuthorizationProps.idToken}`,
          operator: 'contains',
          value,
        },
      ],
    },
  ];
};
