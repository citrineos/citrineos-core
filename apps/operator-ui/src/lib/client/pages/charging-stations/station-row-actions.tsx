// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDetailsDto } from '@lib/cls/charging-station-dto';
import { InlineNotice, InlineNoticeText } from '@lib/client/components/inline-notice';
import { ResetButton } from '@lib/client/pages/charging-stations/reset-button';
import { StartTransactionButton } from '@lib/client/pages/charging-stations/start-transaction-button';
import { StopTransactionButton } from '@lib/client/pages/charging-stations/stop-transaction-button';
import { getTransactionCommandAvailability } from '@lib/client/pages/charging-stations/transaction-command-availability';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import {
  PERMISSION_RESET,
  START_TRANSACTION_PERMISSIONS,
  STOP_TRANSACTION_PERMISSIONS,
} from '@lib/utils/permissions';
import { useCan } from '@refinedev/core';
import React from 'react';

const ACTION_COLUMN_PERMISSIONS = [
  ...START_TRANSACTION_PERMISSIONS,
  ...STOP_TRANSACTION_PERMISSIONS,
  PERMISSION_RESET,
];

export const StationRowActions = ({ station }: { station: ChargingStationDetailsDto }) => {
  const { data } = useCan({
    resource: ResourceType.CHARGING_STATIONS,
    action: ActionType.COMMAND,
    params: { permission: ACTION_COLUMN_PERMISSIONS },
  });
  const { canStart, canStop } = getTransactionCommandAvailability(station);

  if (!data?.can) {
    return <InlineNotice text={InlineNoticeText.NO_COMMAND_PERMISSIONS} />;
  }

  if (!station.isOnline) {
    return <InlineNotice text={InlineNoticeText.COMMANDS_UNAVAILABLE} />;
  }

  return (
    <div className="flex gap-4 w-fit" onClick={(e) => e.stopPropagation()}>
      {canStart && <StartTransactionButton station={station} />}
      {canStop && <StopTransactionButton station={station} />}
      <ResetButton station={station} />
    </div>
  );
};
