// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { ActionType, CommandType, ResourceType } from '@lib/utils/access-types';
import { Button } from '@lib/client/components/ui/button';
import { CanAccess, useTranslate } from '@refinedev/core';
import type { ChargingStationDto } from '@citrineos/types';
import { useDispatch } from 'react-redux';
import { openModal } from '@lib/utils/store/modal-slice';
import { ModalComponentType } from '@lib/client/components/modals/modal-types';
import { instanceToPlain } from 'class-transformer';

/**
 * Intended to trigger the "Reset" modal; used by charging stations views.
 */
export const ResetButton = ({
  station,
  disabled = false,
}: {
  station: ChargingStationDto;
  disabled?: boolean;
}) => {
  const dispatch = useDispatch();
  const translate = useTranslate();

  return (
    <CanAccess
      resource={ResourceType.CHARGING_STATIONS}
      action={ActionType.COMMAND}
      params={{
        id: station.id,
        commandType: CommandType.RESET,
      }}
    >
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => {
          dispatch(
            openModal({
              title: translate('ChargingStations.reset'),
              modalComponentType: ModalComponentType.reset,
              modalComponentProps: { station: instanceToPlain(station) },
            }),
          );
        }}
      >
        {translate('ChargingStations.reset')}
      </Button>
    </CanAccess>
  );
};
