// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

'use client';

import React from 'react';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import { InfoTooltip } from '@lib/client/components/info-tooltip';

interface KeyValueDisplayProps {
  keyLabel: string | React.ReactNode;
  value: any;
  valueRender?: (value?: any) => React.ReactNode;
  info?: string;
}

export const KeyValueDisplay = ({ keyLabel, value, valueRender, info }: KeyValueDisplayProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-accent-foreground font-semibold">{keyLabel}</span>
        {info && <InfoTooltip info={info} />}
      </div>
      {valueRender ? valueRender(value) : <span>{value ?? NOT_APPLICABLE}</span>}
    </div>
  );
};
