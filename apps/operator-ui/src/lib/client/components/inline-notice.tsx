// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { buttonIconSize } from '@lib/client/styles/icon';
import { useTranslate } from '@refinedev/core';
import { Info } from 'lucide-react';
import React from 'react';

export const InlineNoticeText = {
  COMMANDS_UNAVAILABLE: 'ChargingStations.commandsUnavailable',
  NO_COMMAND_PERMISSIONS: 'ChargingStations.noCommandPermissions',
} as const;

export type InlineNoticeText = (typeof InlineNoticeText)[keyof typeof InlineNoticeText];

export const InlineNotice = ({ text }: { text: InlineNoticeText }) => {
  const translate = useTranslate();

  return (
    <div className="flex gap-2 items-center text-muted-foreground">
      <Info className={buttonIconSize} />
      <span className="text-sm">{translate(text)}</span>
    </div>
  );
};
