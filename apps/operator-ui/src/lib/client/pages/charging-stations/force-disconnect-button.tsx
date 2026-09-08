// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { ActionType, CommandType, ResourceType } from '@lib/utils/access-types';
import { Button } from '@lib/client/components/ui/button';
import { CanAccess, useTranslate } from '@refinedev/core';

/**
 * Intended to trigger the "Force Disconnect" modal; used by charging stations views.
 */
export const ForceDisconnectButton = ({
  id,
  onClickAction,
  disabled = false,
}: {
  id: number | undefined;
  onClickAction: () => void;
  disabled?: boolean;
}) => {
  const translate = useTranslate();
  if (id === undefined) return null;

  return (
    <CanAccess
      resource={ResourceType.CHARGING_STATIONS}
      action={ActionType.COMMAND}
      params={{
        id,
        commandType: CommandType.FORCE_DISCONNECT,
      }}
    >
      <Button variant="destructive" disabled={disabled} onClick={onClickAction}>
        {translate('ChargingStations.forceDisconnect')}
      </Button>
    </CanAccess>
  );
};
