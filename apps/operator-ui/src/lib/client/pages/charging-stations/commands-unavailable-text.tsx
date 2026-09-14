// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { buttonIconSize } from '@lib/client/styles/icon';
import { useTranslate } from '@refinedev/core';

/**
 * Text to indicate that no commands are available because the station is offline;
 * used by charging stations views.
 */
export const CommandsUnavailableText = () => {
  const translate = useTranslate();

  return (
    <div className="flex gap-2 items-center text-muted-foreground">
      <Info className={buttonIconSize} />
      <span className="text-sm">{translate('ChargingStations.commandsUnavailable')}</span>
    </div>
  );
};
