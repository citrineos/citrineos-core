// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { ChargingStationProps, LocationProps } from '@citrineos/base';
import { CanAccess, type CrudFilter } from '@refinedev/core';
import type { ColumnConfiguration } from '@lib/utils/column.configuration';
import type { CellContext } from '@tanstack/react-table';
import {
  type ChargingStationDetailsDto,
  ChargingStationDetailsProps,
} from '@lib/cls/charging.station.dto';
import { TableCellLink } from '@lib/client/components/table-cell-link';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import ProtocolTag from '@lib/client/components/protocol-tag';
import { ACTIONS_COLUMN } from '@lib/client/hooks/useColumnPreferences';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { StartTransactionButton } from '@lib/client/pages/charging-stations/start.transaction.button';
import { StopTransactionButton } from '@lib/client/pages/charging-stations/stop.transaction.button';
import { ResetButton } from '@lib/client/pages/charging-stations/reset.button';
import { CommandsUnavailableText } from '@lib/client/pages/charging-stations/commands.unavailable.text';
import { isEmpty } from '@lib/utils/assertion';
import { EMPTY_VALUE } from '@lib/utils/consts';
import { badgeListStyle } from '@lib/client/styles/page';
import { Badge } from '@lib/client/components/ui/badge';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';

type TranslateFn = (key: string, options?: any) => string;

export const getChargingStationsColumns = (
  includeLocation = true,
  translate?: TranslateFn,
): ColumnConfiguration[] => {
  // Falls back to the English string when no translate function is provided
  // (e.g. when invoked from areas that have not yet wired up i18n).
  const t = (key: string, fallback: string) => (translate ? translate(key) : fallback);
  return [
    {
      key: ChargingStationProps.id,
      header: t('ChargingStations.columns.name', 'Name'),
      visible: true,
      sortable: true,
      filterConfig: { type: 'text', label: t('ChargingStations.columns.stationId', 'Station ID') },
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) => (
        <TableCellLink
          path={`/${MenuSection.CHARGING_STATIONS}/${row.original.id}`}
          value={row.original[ChargingStationDetailsProps.ocppConnectionName]}
        />
      ),
    },
    ...(includeLocation
      ? [
          {
            key: ChargingStationDetailsProps.location,
            header: t('ChargingStations.columns.location', 'Location'),
            visible: true,
            cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) => (
              <TableCellLink
                path={`/${MenuSection.LOCATIONS}/${row.original.location?.id}`}
                value={row.original.location?.name}
              />
            ),
          },
        ]
      : []),
    {
      key: ChargingStationDetailsProps.statusNotifications,
      header: t('Common.status', 'Status'),
      visible: true,
      filterConfig: {
        type: 'yesno',
        field: 'isOnline',
        label: t('ChargingStations.columns.onlineStatus', 'Online status'),
      },
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) => (
        <span className={row.original.isOnline ? 'text-success' : 'text-destructive'}>
          {row.original.isOnline ? t('Common.online', 'Online') : t('Common.offline', 'Offline')}
        </span>
      ),
    },
    {
      key: ChargingStationDetailsProps.protocol,
      header: t('ChargingStations.columns.protocol', 'Protocol'),
      visible: true,
      filterConfig: {
        type: 'enum',
        label: t('ChargingStations.columns.protocol', 'Protocol'),
        enumOptions: [
          { label: 'OCPP 1.6', value: 'ocpp1.6' },
          { label: 'OCPP 2.0.1', value: 'ocpp2.0.1' },
          { label: 'OCPP 2.1', value: 'ocpp2.1' },
        ],
      },
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) => (
        <ProtocolTag protocol={row.original[ChargingStationDetailsProps.protocol]} />
      ),
    },
    {
      key: 'vendorModel',
      header: t('ChargingStations.columns.vendorModel', 'Vendor / Model'),
      visible: false,
      filterConfig: {
        type: 'text',
        field: 'chargePointVendor',
        label: t('ChargingStations.columns.vendor', 'Vendor'),
      },
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) => (
        <span>{`${row.original.chargePointVendor ?? EMPTY_VALUE} / ${row.original.chargePointModel ?? EMPTY_VALUE}`}</span>
      ),
    },
    {
      key: ChargingStationDetailsProps.floorLevel,
      header: t('ChargingStations.columns.floorLevel', 'Floor Level'),
      visible: false,
      filterConfig: {
        type: 'text',
        label: t('ChargingStations.columns.floorLevel', 'Floor Level'),
      },
    },
    {
      key: ChargingStationDetailsProps.parkingRestrictions,
      header: t('ChargingStations.columns.parkingRestrictions', 'Parking Restrictions'),
      visible: false,
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) => (
        <div className={badgeListStyle}>
          {!isEmpty(row.original.parkingRestrictions) ? (
            row.original.parkingRestrictions.map((pr: any) => (
              <Badge key={pr} variant="muted">
                {pr}
              </Badge>
            ))
          ) : (
            <span>{EMPTY_VALUE}</span>
          )}
        </div>
      ),
    },
    {
      key: ChargingStationDetailsProps.capabilities,
      header: t('ChargingStations.columns.capabilities', 'Capabilities'),
      visible: false,
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) => (
        <div className={badgeListStyle}>
          {!isEmpty(row.original.capabilities) ? (
            row.original.capabilities.map((cap: any) => (
              <Badge key={cap} variant="muted">
                {cap}
              </Badge>
            ))
          ) : (
            <span>{EMPTY_VALUE}</span>
          )}
        </div>
      ),
    },
    {
      key: ChargingStationDetailsProps.firmwareVersion,
      header: t('ChargingStations.columns.firmwareVersion', 'Firmware Version'),
      visible: false,
      filterConfig: {
        type: 'text',
        label: t('ChargingStations.columns.firmwareVersion', 'Firmware Version'),
      },
    },
    {
      key: ChargingStationDetailsProps.createdAt,
      header: t('ChargingStations.columns.createdAt', 'Created At'),
      visible: false,
      sortable: true,
      filterConfig: { type: 'date', label: t('ChargingStations.columns.createdAt', 'Created At') },
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) =>
        row.original.createdAt ? (
          <TimestampDisplay isoTimestamp={row.original.createdAt} />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: ChargingStationDetailsProps.updatedAt,
      header: t('ChargingStations.columns.updatedAt', 'Updated At'),
      visible: false,
      sortable: true,
      filterConfig: { type: 'date', label: t('ChargingStations.columns.updatedAt', 'Updated At') },
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) =>
        row.original.updatedAt ? (
          <TimestampDisplay isoTimestamp={row.original.updatedAt} />
        ) : (
          <span>{EMPTY_VALUE}</span>
        ),
    },
    {
      key: ACTIONS_COLUMN,
      header: t('Common.actions', 'Actions'),
      visible: true,
      cellRender: ({ row }: CellContext<ChargingStationDetailsDto, unknown>) => {
        const hasActiveTransactions = !isEmpty(row.original.transactions);

        return row.original.isOnline ? (
          <CanAccess
            resource={ResourceType.CHARGING_STATIONS}
            action={ActionType.COMMAND}
            params={{
              id: row.original.id,
            }}
          >
            <div className="flex gap-4 flex-1">
              {!hasActiveTransactions && <StartTransactionButton station={row.original} />}
              {hasActiveTransactions && <StopTransactionButton station={row.original} />}
              <ResetButton station={row.original} />
            </div>
          </CanAccess>
        ) : (
          <CommandsUnavailableText />
        );
      },
    },
  ];
};

export const getChargingStationsFilters = (value: string): CrudFilter[] => {
  return [
    {
      operator: 'or',
      value: [
        {
          field: ChargingStationProps.ocppConnectionName,
          operator: 'contains',
          value,
        },
        {
          field: `Location.${LocationProps.name}`,
          operator: 'contains',
          value,
        },
      ],
    },
  ];
};
