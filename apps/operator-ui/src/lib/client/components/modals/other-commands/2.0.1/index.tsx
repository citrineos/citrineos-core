// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDto } from '@citrineos/base';
import {
  OCPP2_0_1_COMMANDS_REGISTRY,
  type CommandDefinition,
} from '@lib/client/components/modals/2.0.1/commands.registry';
import { Button } from '@lib/client/components/ui/button';
import type { ListCanReturnType } from '@lib/utils/access.types';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { closeModal, openModal } from '@lib/utils/store/modal.slice';
import { useCan, useTranslate } from '@refinedev/core';
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

  const commandsToExclude: string[] = [];

  const { data } = useCan({
    resource: ResourceType.CHARGING_STATIONS,
    action: ActionType.COMMAND,
    params: {
      id: station.ocppConnectionName,
      commandType: 'otherCommands',
    },
  });

  const listData = data as ListCanReturnType;
  if (!data?.can) {
    return null;
  } else if (listData?.meta?.exceptions) {
    for (const exception of listData.meta.exceptions) {
      if (exception.param === 'commandType') {
        commandsToExclude.push(...exception.values);
      }
    }
  }

  return (
    <div className="size-full overflow-hidden space-y-4">
      {Object.entries(OCPP2_0_1_COMMANDS_REGISTRY).map(([commandKey, commandDef]) => (
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
