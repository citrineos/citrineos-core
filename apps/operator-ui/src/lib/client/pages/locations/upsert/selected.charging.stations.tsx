// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { LocationProps } from '@citrineos/base';
import { Combobox } from '@lib/client/components/combobox';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { Button } from '@lib/client/components/ui/button';
import { CHARGING_STATIONS_LIST_QUERY } from '@lib/queries/charging.stations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { useSelect, useTranslate } from '@refinedev/core';
import { CanAccess } from '@refinedev/core';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { heading3Style } from '@lib/client/styles/page';
import { buttonIconSize } from '@lib/client/styles/icon';
import { cardHeaderFlex } from '@lib/client/styles/card';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import { useFieldArray } from 'react-hook-form';
import { RemoveArrayItemButton } from '@lib/client/components/form/remove-array-item-button';

type FormInstance = any;

export interface SelectedChargingStationsProps {
  form: FormInstance;
  params?: { id?: string };
}

export const SelectedChargingStations = ({ form, params }: SelectedChargingStationsProps) => {
  const { push } = useRouter();
  const translate = useTranslate();
  const locationId = params?.id ? params.id : undefined;

  const {
    fields: chargingStations,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: LocationProps.chargingPool,
    keyName: 'fieldArrayId',
  });

  const handleAddNewChargingStation = () => {
    push(`/${MenuSection.CHARGING_STATIONS}/new?locationId=${locationId}`);
  };

  const { options, onSearch, query } = useSelect({
    resource: ResourceType.CHARGING_STATIONS,
    optionLabel: 'id',
    optionValue: (station) => JSON.stringify(station),
    meta: {
      gqlQuery: CHARGING_STATIONS_LIST_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 5,
        where: {
          _or: [{ locationId: { _neq: locationId } }, { locationId: { _is_null: true } }],
        },
      },
    },
    pagination: { mode: 'off' },
  });

  return (
    <CanAccess
      resource={ResourceType.CHARGING_STATIONS}
      action={ActionType.LIST}
      fallback={<AccessDeniedFallback />}
    >
      <Card>
        <CardHeader>
          <div className={cardHeaderFlex}>
            <h3 className={heading3Style}>{translate('ChargingStations.ChargingStations')}</h3>
            <CanAccess
              resource={ResourceType.CHARGING_STATIONS}
              action={ActionType.CREATE}
              fallback={<AccessDeniedFallback />}
            >
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={handleAddNewChargingStation}
              >
                <Plus className={buttonIconSize} />
                {translate('buttons.add')}
              </Button>
            </CanAccess>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 w-full">
            <Combobox<string>
              options={options}
              onSelect={(stringifiedStation) => {
                append(JSON.parse(stringifiedStation));
              }}
              onSearch={onSearch}
              placeholder={translate('Locations.stations.searchChargingStation')}
              emptyMessage={
                query.isLoading
                  ? translate('Common.loadingEllipsis')
                  : translate('Locations.stations.noChargingStationsFound')
              }
              isLoading={query.isLoading}
              skipValue
            />
            {chargingStations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {translate('Locations.stations.noChargingStationsSelected')}
              </div>
            ) : (
              <div className="border rounded-md flex flex-col gap-4">
                {chargingStations.map((station: any, index: number) => (
                  <div
                    key={station.fieldArrayId}
                    className="flex items-center justify-between gap-4 p-4 w-full border-b last:border-b-0"
                  >
                    <KeyValueDisplay
                      keyLabel={translate('Locations.stations.stationId')}
                      value={station.ocppConnectionName}
                    />
                    <KeyValueDisplay
                      keyLabel={translate('Common.status')}
                      value={station.isOnline}
                      valueRender={(isOnline: any) => (
                        <span className={isOnline ? 'text-success' : 'text-destructive'}>
                          {isOnline ? translate('Common.online') : translate('Common.offline')}
                        </span>
                      )}
                    />
                    <KeyValueDisplay
                      keyLabel={translate('Locations.stations.configuration')}
                      value={
                        station.firmwareVersion ??
                        translate('Locations.stations.needsConfiguration')
                      }
                    />
                    <KeyValueDisplay
                      keyLabel={translate('Locations.stations.modelVendor')}
                      value={`${
                        station.chargePointModel ?? translate('Locations.stations.needsModel')
                      } / ${
                        station.chargePointVendor ?? translate('Locations.stations.needsVendor')
                      }`}
                    />
                    <RemoveArrayItemButton onRemoveAction={() => remove(index)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </CanAccess>
  );
};
