// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDto } from '@citrineos/types';
import {
  OCPP2_0_1_COMMANDS_REGISTRY,
  type CommandDefinition,
} from '@lib/client/components/modals/2.0.1/commands-registry';
import { Button } from '@lib/client/components/ui/button';
import { closeModal, openModal } from '@lib/utils/store/modal-slice';
import { useTranslate } from '@refinedev/core';
import { useAllowedCommands } from '@lib/client/hooks/use-allowed-commands';
import { instanceToPlain } from 'class-transformer';
import { useDispatch } from 'react-redux';

export interface OCPP2_0_1_CommandsProps {
  station: ChargingStationDto;
}

export const OCPP2_0_1_Commands = ({ station }: OCPP2_0_1_CommandsProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();

  const handleCommandClick = (commandDef: CommandDefinition) => {
    dispatch(
      openModal({
        title: translate(commandDef.displayNameKey),
        modalComponentType: commandDef.modalType,
        modalComponentProps: { station: instanceToPlain(station) },
      }),
    );
  };

  const { commands: permittedCommands, isResolved } = useAllowedCommands(
    OCPP2_0_1_COMMANDS_REGISTRY,
  );

  if (isResolved && permittedCommands.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {translate('ChargingStations.noAdditionalCommands')}
      </div>
    );
  }

  return (
    <div className="size-full overflow-hidden space-y-4">
      {isResolved &&
        permittedCommands.map(([commandKey, commandDef]) => (
          <Button
            key={commandKey}
            variant="outline"
            className="w-full"
            onClick={() => handleCommandClick(commandDef)}
          >
            {translate(commandDef.displayNameKey)}
          </Button>
        ))}
    </div>
  );
};
