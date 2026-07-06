// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { LocationProps, type LocationDto, ChargingStationProps } from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { getFullAddress } from '@lib/utils/geocoding';
import { ChevronDownIcon } from 'lucide-react';
import type { ColumnConfiguration } from '@lib/utils/column.configuration';
import { TableCellLink } from '@lib/client/components/table-cell-link';
import type { CellContext } from '@tanstack/react-table';
import { ACTIONS_COLUMN } from '@lib/client/hooks/useColumnPreferences';
import { EMPTY_VALUE } from '@lib/utils/consts';
import { badgeListStyle } from '@lib/client/styles/page';
import { isEmpty } from '@lib/utils/assertion';
import { Badge } from '@lib/client/components/ui/badge';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
type TranslateFn = (key: string, options?: any) => string;

export const getLocationsColumns = (translate: TranslateFn): ColumnConfiguration[] => [
  {
    key: LocationProps.name,
    header: translate('Locations.columns.name'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) => (
      <TableCellLink
        path={`/${MenuSection.LOCATIONS}/${row.original.id}`}
        value={row.original.name ?? translate('Locations.unnamedLocation')}
      />
    ),
  },
  {
    key: LocationProps.address,
    header: translate('Locations.columns.address'),
    visible: true,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) => (
      <span>
        {row.original.address
          ? getFullAddress(row.original as Partial<LocationDto>)
          : translate('Locations.noAddress')}
      </span>
    ),
  },
  {
    key: 'latitude',
    header: translate('Locations.columns.latitude'),
    visible: false,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) => (
      <span>
        {row.original.coordinates
          ? row.original.coordinates.coordinates[1].toFixed(4)
          : EMPTY_VALUE}
      </span>
    ),
  },
  {
    key: 'longitude',
    header: translate('Locations.columns.longitude'),
    visible: false,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) => (
      <span>
        {row.original.coordinates
          ? row.original.coordinates.coordinates[0].toFixed(4)
          : EMPTY_VALUE}
      </span>
    ),
  },
  {
    key: LocationProps.timeZone,
    header: translate('Locations.columns.timeZone'),
    visible: false,
    sortable: true,
  },
  {
    key: LocationProps.parkingType,
    header: translate('Locations.columns.parkingType'),
    visible: false,
  },
  {
    key: LocationProps.facilities,
    header: translate('Locations.columns.facilities'),
    visible: false,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) => (
      <div className={badgeListStyle}>
        {!isEmpty(row.original.facilities) ? (
          row.original.facilities.map((facility: any) => (
            <Badge key={facility} variant="muted">
              {facility}
            </Badge>
          ))
        ) : (
          <span>{EMPTY_VALUE}</span>
        )}
      </div>
    ),
  },
  {
    key: 'totalStations',
    header: translate('Locations.columns.totalStations'),
    visible: true,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) => (
      <span>{row.original.chargingPool?.length ?? 0}</span>
    ),
  },
  {
    key: LocationProps.createdAt,
    header: translate('Locations.columns.createdAt'),
    visible: false,
    sortable: true,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) =>
      row.original.createdAt ? (
        <TimestampDisplay isoTimestamp={row.original.createdAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: LocationProps.updatedAt,
    header: translate('Locations.columns.updatedAt'),
    visible: false,
    sortable: true,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) =>
      row.original.updatedAt ? (
        <TimestampDisplay isoTimestamp={row.original.updatedAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: ACTIONS_COLUMN,
    header: '',
    visible: true,
    cellRender: ({ row }: CellContext<LocationDto, unknown>) => (
      <div
        className="flex items-center justify-end gap-2 cursor-pointer hover:text-primary transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          row.toggleExpanded();
        }}
      >
        <span className="text-sm">{translate('Locations.viewStations')}</span>
        <ChevronDownIcon
          className={`transition-transform duration-200 ${row.getIsExpanded() ? 'rotate-180' : ''}`}
        />
      </div>
    ),
  },
];

/**
 * Create filters for searching both location fields and nested charging stations
 * Using Hasura's GraphQL nested filtering capabilities
 * @param value Search text
 * @returns An object containing the "where" and custom "chargingStationsWhere" query that
 * will be passed directly to gqlVariables.
 */
export const getLocationFilters = (
  value: string,
): {
  where: Record<string, any[]>;
  chargingStationsWhere: Record<string, any[]>;
} => {
  if (!value) {
    return {
      where: {},
      chargingStationsWhere: {},
    };
  }

  const filterValue = `%${value}%`;

  // Location filters + Charging Station filter, the latter of which
  // is required on BOTH levels of the filter, hence the duplication.
  const locationFieldsFilter = {
    _or: [
      {
        [LocationProps.name]: {
          _ilike: filterValue,
        },
      },
      {
        [LocationProps.city]: {
          _ilike: filterValue,
        },
      },
      {
        [LocationProps.state]: {
          _ilike: filterValue,
        },
      },
      {
        [LocationProps.postalCode]: {
          _ilike: filterValue,
        },
      },
      {
        [LocationProps.country]: {
          _ilike: filterValue,
        },
      },
      {
        ChargingStations: {
          [ChargingStationProps.id]: {
            _ilike: filterValue,
          },
        },
      },
    ],
  };

  // Create charging station filters for nested charging station fields
  const chargingStationsFilter = {
    _or: [
      {
        [ChargingStationProps.id]: {
          _ilike: filterValue,
        },
      },
    ],
  };

  return {
    where: locationFieldsFilter,
    chargingStationsWhere: chargingStationsFilter,
  };
};
