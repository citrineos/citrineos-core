// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDto } from '@citrineos/base';
import { BaseProps } from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { ChargerRow } from '@lib/client/pages/overview/charger.row';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { FAULTED_CHARGING_STATIONS_LIST_QUERY } from '@lib/queries/charging.stations';
import { ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { useList, useTranslate } from '@refinedev/core';
import { ChevronRightIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const FaultedChargersCard = () => {
  const { push } = useRouter();
  const translate = useTranslate();

  const {
    query: { data, isLoading, isError },
  } = useList<ChargingStationDto>({
    resource: ResourceType.CHARGING_STATIONS,
    meta: {
      gqlQuery: FAULTED_CHARGING_STATIONS_LIST_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 10,
      },
    },
    queryOptions: getPlainToInstanceOptions(ChargingStationClass),
    sorters: [{ field: BaseProps.updatedAt, order: 'desc' }],
    pagination: {
      mode: 'off',
    },
  });

  const chargingStations: ChargingStationDto[] = data?.data ?? [];

  if (isLoading) {
    return <div>{translate('Common.loadingEllipsis')}</div>;
  }

  if (isError) {
    return <div>{translate('Overview.somethingWentWrong')}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <h4 className="text-lg font-semibold">{translate('Overview.faultedChargers')}</h4>
        <div
          className="link flex items-center cursor-pointer"
          onClick={() => push(`/${MenuSection.CHARGING_STATIONS}`)}
        >
          {translate('Overview.viewAll')} <ChevronRightIcon />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {chargingStations.map((chargingStation: ChargingStationDto) => (
          <ChargerRow chargingStation={chargingStation} key={chargingStation.id} />
        ))}
      </div>
    </div>
  );
};
