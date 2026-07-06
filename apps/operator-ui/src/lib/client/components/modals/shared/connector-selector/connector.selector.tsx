// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import type { ChargingStationDto, ConnectorDto } from '@citrineos/base';
import { ConnectorProps } from '@citrineos/base';
import { Combobox } from '@lib/client/components/combobox';
import { GET_CONNECTOR_LIST_FOR_STATION_EVSE } from '@lib/queries/connectors';
import { CONNECTOR_LIST_FOR_STATION_QUERY } from '@lib/queries/connectors';
import { ResourceType } from '@lib/utils/access.types';
import { useSelect, useTranslate } from '@refinedev/core';
import { Field, FieldDescription, FieldLabel } from '@lib/client/components/ui/field';
import {
  formLabelStyle,
  formLabelWrapperStyle,
  formRequiredAsterisk,
} from '@lib/client/components/form/field';
import { Loader2 } from 'lucide-react';

export interface ConnectorSelectorProps {
  onSelect: (value: number) => void;
  station: ChargingStationDto;
  evseId?: number; // For OCPP 2.0.1 - filter connectors by EVSE
  value?: number;
  isOptional?: boolean;
  requiresEvseId?: boolean;
}

export const ConnectorSelector = ({
  station,
  onSelect,
  evseId,
  value,
  isOptional = false,
  requiresEvseId = false,
}: ConnectorSelectorProps) => {
  const translate = useTranslate();
  // Use different query based on whether we're filtering by EVSE (2.0.1) or not (1.6)
  const gqlQuery =
    evseId !== undefined ? GET_CONNECTOR_LIST_FOR_STATION_EVSE : CONNECTOR_LIST_FOR_STATION_QUERY;

  const gqlVariables =
    evseId !== undefined
      ? {
          offset: 0,
          limit: 10,
          stationId: station.id,
          where: { evseId: { _eq: evseId } },
        }
      : {
          offset: 0,
          limit: 10,
          stationId: station.id,
        };

  const { options, onSearch, query } = useSelect<ConnectorDto>({
    resource: ResourceType.CONNECTORS,
    optionLabel: 'connectorId',
    optionValue: 'connectorId',
    meta: {
      gqlQuery,
      gqlVariables,
    },
    sorters: [{ field: ConnectorProps.connectorId, order: 'asc' }],
    pagination: { mode: 'off' },
    onSearch: (value: string) => {
      const connectorId = Number(value);
      if (!connectorId || !Number.isInteger(connectorId) || connectorId < 1) {
        return [];
      }
      return [
        {
          operator: 'or',
          value: [{ field: ConnectorProps.connectorId, operator: 'eq', value }],
        },
      ];
    },
  });

  return (
    <Field>
      <FieldLabel className={formLabelWrapperStyle}>
        <span className={formLabelStyle}>
          {translate('ChargingStations.connectorSelector.label')}
        </span>
        {!isOptional && formRequiredAsterisk}
      </FieldLabel>
      {requiresEvseId && !evseId && (
        <span className="text-sm text-muted-foreground">
          {translate('ChargingStations.connectorSelector.selectEvse')}
        </span>
      )}
      {query.isLoading && ((requiresEvseId && evseId) || !requiresEvseId) && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            {translate('ChargingStations.connectorSelector.loading')}
          </span>
        </div>
      )}
      {!query.isLoading && ((requiresEvseId && evseId) || !requiresEvseId) && (
        <Combobox<number>
          options={options}
          onSelect={onSelect}
          value={value}
          onSearch={onSearch}
          placeholder={translate('ChargingStations.connectorSelector.searchPlaceholder')}
          isLoading={query.isLoading}
        />
      )}
      <FieldDescription>
        {evseId !== undefined
          ? translate('ChargingStations.connectorSelector.descriptionForEvse')
          : translate('ChargingStations.connectorSelector.description')}
      </FieldDescription>
    </Field>
  );
};
