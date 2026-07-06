// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import type { ChargingStationDto, EvseDto } from '@citrineos/base';
import { EvseProps } from '@citrineos/base';
import { Combobox } from '@lib/client/components/combobox';
import { GET_EVSE_LIST_FOR_STATION } from '@lib/queries/evses';
import { ResourceType } from '@lib/utils/access.types';
import { useSelect, useTranslate } from '@refinedev/core';
import {
  formLabelStyle,
  formLabelWrapperStyle,
  formRequiredAsterisk,
} from '@lib/client/components/form/field';
import { Loader2 } from 'lucide-react';
import { Field, FieldDescription, FieldLabel } from '@lib/client/components/ui/field';

export interface EvseSelectorProps {
  onSelect: (value: string) => void;
  station: ChargingStationDto;
  value?: string; // { id, evseTypeId }
  isOptional?: boolean;
}

/**
 * EvseSelector works in tandem with {@link ConnectorSelector} to choose an EVSE for
 * an operation, usually an OCPP message. Note that the value is formatted as:
 * {
 *   id: number,
 *   evseTypeId: number
 * }
 *
 * and JSON.stringified because Connectors require the id (a.k.a. the DB ID) for the EVSE
 * but humans generally want to know the evseTypeId (the serial integer starting from 1).
 */
export const EvseSelector = ({
  station,
  onSelect,
  value,
  isOptional = false,
}: EvseSelectorProps) => {
  const translate = useTranslate();
  const { options, onSearch, query } = useSelect<EvseDto>({
    resource: ResourceType.EVSES,
    optionLabel: 'evseTypeId',
    optionValue: (evse) => JSON.stringify({ id: evse.id, evseTypeId: evse.evseTypeId }),
    meta: {
      gqlQuery: GET_EVSE_LIST_FOR_STATION,
      gqlVariables: {
        offset: 0,
        limit: 10,
        stationId: station.id,
      },
    },
    sorters: [{ field: EvseProps.evseTypeId, order: 'asc' }],
    pagination: { mode: 'off' },
    onSearch: (value: string) => {
      const evseId = Number(value);
      if (!evseId || !Number.isInteger(evseId) || evseId < 1) {
        return [];
      }
      return [
        {
          operator: 'or',
          value: [{ field: EvseProps.evseTypeId, operator: 'eq', value }],
        },
      ];
    },
  });

  console.log('options??', JSON.stringify(options));
  // Format options for Combobox
  const formattedOptions = options.map((option: any) => ({
    value: option.value,
    label: String(option.label),
  }));

  return (
    <Field>
      <FieldLabel className={formLabelWrapperStyle}>
        <span className={formLabelStyle}>{translate('ChargingStations.evseSelector.label')}</span>
        {!isOptional && formRequiredAsterisk}
      </FieldLabel>
      {query.isLoading && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            {translate('ChargingStations.evseSelector.loading')}
          </span>
        </div>
      )}
      {!query.isLoading && (
        <Combobox<string>
          key={formattedOptions.length}
          options={formattedOptions}
          value={value}
          onSelect={onSelect}
          onSearch={onSearch}
          placeholder={translate('ChargingStations.evseSelector.searchPlaceholder')}
          isLoading={query.isLoading}
        />
      )}
      <FieldDescription>{translate('ChargingStations.evseSelector.description')}</FieldDescription>
    </Field>
  );
};
