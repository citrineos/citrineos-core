// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import {
  ChargingStationProps,
  NetworkAlertProps,
  NetworkAlertResolvedBySchema,
  NetworkAlertSeveritySchema,
  NetworkAlertStatusSchema,
  NetworkAlertTypeSchema,
} from '@citrineos/types';
import { MenuSection } from '@lib/client/components/main-menu/main-menu';
import { chargingStationPath } from '@lib/utils/resource-paths';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import type { CrudFilters } from '@refinedev/core';
import { TableCellLink } from '@lib/client/components/table-cell-link';
import type { CellContext } from '@tanstack/react-table';
import type { ColumnConfiguration } from '@lib/utils/column-configuration';
import { NetworkAlertClass } from '@lib/cls/network-alert-dto';
import { EMPTY_VALUE } from '@lib/utils/consts';
import {
  NetworkAlertSeverityTag,
  NetworkAlertStatusTag,
} from '@lib/client/pages/network-alerts/network-alert-tags';
import { formatNetworkAlertDetails } from '@lib/client/pages/network-alerts/network-alert-details';

export const networkAlertStationIdField = `ChargingStation.${ChargingStationProps.ocppConnectionName}`;

type TranslateFn = (key: string, options?: any) => string;

const toEnumOptions = (values: readonly string[]) =>
  values.map((value) => ({ label: value, value }));

export const getNetworkAlertsColumns = (translate: TranslateFn): ColumnConfiguration[] => [
  {
    key: NetworkAlertProps.id,
    header: translate('NetworkAlerts.columns.id'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) => (
      <TableCellLink
        path={`/${MenuSection.NETWORK_ALERTS}/${row.original.id}`}
        value={row.original.id}
      />
    ),
  },
  {
    key: NetworkAlertProps.severity,
    header: translate('NetworkAlerts.columns.severity'),
    visible: true,
    sortable: true,
    filterConfig: {
      type: 'enum',
      enumOptions: toEnumOptions(NetworkAlertSeveritySchema.options),
    },
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) =>
      row.original.severity ? (
        <NetworkAlertSeverityTag severity={row.original.severity} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: NetworkAlertProps.status,
    header: translate('NetworkAlerts.columns.status'),
    visible: true,
    sortable: true,
    filterConfig: {
      type: 'enum',
      enumOptions: toEnumOptions(NetworkAlertStatusSchema.options),
    },
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) =>
      row.original.status ? (
        <NetworkAlertStatusTag status={row.original.status} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: NetworkAlertProps.type,
    header: translate('NetworkAlerts.columns.type'),
    visible: true,
    sortable: true,
    filterConfig: {
      type: 'enum',
      enumOptions: toEnumOptions(NetworkAlertTypeSchema.options),
    },
  },
  {
    key: networkAlertStationIdField,
    header: translate('NetworkAlerts.columns.stationId'),
    visible: true,
    sortable: true,
    filterConfig: { type: 'text' },
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) =>
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
    key: NetworkAlertProps.evseId,
    header: translate('NetworkAlerts.columns.evse'),
    visible: true,
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) => (
      <span>{row.original.evse?.evseTypeId ?? EMPTY_VALUE}</span>
    ),
  },
  {
    key: NetworkAlertProps.connectorId,
    header: translate('NetworkAlerts.columns.connector'),
    visible: true,
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) => (
      <span>{row.original.connector?.connectorId ?? EMPTY_VALUE}</span>
    ),
  },
  {
    key: NetworkAlertProps.details,
    header: translate('NetworkAlerts.columns.details'),
    visible: true,
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) => (
      <span>{formatNetworkAlertDetails(row.original.details)}</span>
    ),
  },
  {
    key: NetworkAlertProps.occurrenceCount,
    header: translate('NetworkAlerts.columns.occurrenceCount'),
    visible: true,
    sortable: true,
  },
  {
    key: NetworkAlertProps.firstSeenAt,
    header: translate('NetworkAlerts.columns.firstSeenAt'),
    visible: true,
    sortable: true,
    filterConfig: { type: 'date' },
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) =>
      row.original.firstSeenAt ? (
        <TimestampDisplay isoTimestamp={row.original.firstSeenAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: NetworkAlertProps.lastSeenAt,
    header: translate('NetworkAlerts.columns.lastSeenAt'),
    visible: true,
    sortable: true,
    filterConfig: { type: 'date' },
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) =>
      row.original.lastSeenAt ? (
        <TimestampDisplay isoTimestamp={row.original.lastSeenAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: NetworkAlertProps.resolvedAt,
    header: translate('NetworkAlerts.columns.resolvedAt'),
    visible: false,
    sortable: true,
    filterConfig: { type: 'date' },
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) =>
      row.original.resolvedAt ? (
        <TimestampDisplay isoTimestamp={row.original.resolvedAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: NetworkAlertProps.resolvedBy,
    header: translate('NetworkAlerts.columns.resolvedBy'),
    visible: false,
    sortable: true,
    filterConfig: {
      type: 'enum',
      enumOptions: toEnumOptions(NetworkAlertResolvedBySchema.options),
    },
  },
  {
    key: NetworkAlertProps.statusNote,
    header: translate('NetworkAlerts.columns.statusNote'),
    visible: false,
  },
  {
    key: NetworkAlertProps.updatedAt,
    header: translate('NetworkAlerts.columns.updatedAt'),
    visible: false,
    sortable: true,
    cellRender: ({ row }: CellContext<NetworkAlertClass, unknown>) =>
      row.original.updatedAt ? (
        <TimestampDisplay isoTimestamp={row.original.updatedAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
];

export const getNetworkAlertsFilters = (value: string): CrudFilters => [
  {
    operator: 'or',
    value: [
      {
        field: networkAlertStationIdField,
        operator: 'contains',
        value,
      },
      {
        field: NetworkAlertProps.type,
        operator: 'contains',
        value,
      },
      {
        field: NetworkAlertProps.statusNote,
        operator: 'contains',
        value,
      },
    ],
  },
];
