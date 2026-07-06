// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { EvseDto } from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { Circle } from '@lib/client/pages/overview/circle/circle';
import type { ChargingStationDetailsDto } from '@lib/cls/charging.station.dto';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Separator } from '@radix-ui/react-menu';
import type { ChargerStatusEnum } from '@lib/utils/enums';
import { useTranslate } from '@refinedev/core';

export interface ChargerRowProps {
  chargingStation: ChargingStationDetailsDto;
  evse?: EvseDto;
  lastStatus?: ChargerStatusEnum;
  circleColor?: string;
  showSeparator?: boolean;
}

export const ChargerRow: React.FC<ChargerRowProps> = ({
  chargingStation,
  evse,
  lastStatus,
  circleColor,
  showSeparator,
}) => {
  const { push } = useRouter();
  const translate = useTranslate();
  const label = evse
    ? `${chargingStation.ocppConnectionName}:EVSE ${evse.id}`
    : chargingStation.ocppConnectionName;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col w-full">
        <div
          className="flex justify-between cursor-pointer hover:text-secondary"
          onClick={() => push(`/${MenuSection.CHARGING_STATIONS}/${chargingStation.id}`)}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">
              {translate('Overview.station')} <span>{label}</span>
            </span>
            <Circle color={circleColor} status={lastStatus} />
          </div>
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-primary"
          onClick={() => push(`/${MenuSection.LOCATIONS}/${chargingStation.location?.id}`)}
        >
          {translate('Overview.location')}
          <span>{chargingStation.location?.name}</span>
        </div>
      </div>

      {showSeparator && <Separator className="h-0.5 w-full bg-muted rounded-full" />}
    </div>
  );
};
