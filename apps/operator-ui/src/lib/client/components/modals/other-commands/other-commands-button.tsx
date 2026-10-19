// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, OCPPVersion } from '@citrineos/types';
import { Button } from '@lib/client/components/ui/button';
import { ModalComponentType } from '@lib/client/components/modals/modal-types';
import { useAllowedCommands, type HasPermission } from '@lib/client/hooks/use-allowed-commands';
import { buttonIconSize } from '@lib/client/styles/icon';
import { openModal } from '@lib/utils/store/modal-slice';
import { useTranslate } from '@refinedev/core';
import { instanceToPlain } from 'class-transformer';
import { MoreHorizontal } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { OCPP1_6_COMMANDS_REGISTRY } from '../1.6/commands-registry';
import { OCPP2_0_1_COMMANDS_REGISTRY } from '../2.0.1/commands-registry';

const REGISTRIES: Record<OCPPVersion, Record<string, HasPermission>> = {
  [OCPPVersion.OCPP1_6]: OCPP1_6_COMMANDS_REGISTRY,
  [OCPPVersion.OCPP2_0_1]: OCPP2_0_1_COMMANDS_REGISTRY,
  [OCPPVersion.OCPP2_1]: OCPP2_0_1_COMMANDS_REGISTRY,
};

export const OtherCommandsButton = ({
  station,
  disabled,
}: {
  station: ChargingStationDto;
  disabled?: boolean;
}) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const { commands, isResolved } = useAllowedCommands(
    REGISTRIES[station.protocol as OCPPVersion] ?? {},
  );

  if (!isResolved || commands.length === 0) {
    return null;
  }

  return (
    <Button
      disabled={disabled}
      onClick={() =>
        dispatch(
          openModal({
            title: translate('ChargingStations.otherCommands'),
            modalComponentType: ModalComponentType.otherCommands,
            modalComponentProps: { station: instanceToPlain(station) },
          }),
        )
      }
    >
      <MoreHorizontal className={buttonIconSize} />
      {translate('ChargingStations.otherCommands')}
    </Button>
  );
};
