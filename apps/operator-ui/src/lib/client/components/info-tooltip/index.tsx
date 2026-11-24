// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@lib/client/components/ui/tooltip';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  info: string;
}

export const InfoTooltip = ({ info }: InfoTooltipProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={info} className="cursor-help">
          <Info size={20} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        className="p-2 max-w-60 border border-border text-sm rounded-sm"
        arrowClassName="border-r border-b border-border translate-y-[calc(-50%_-_1px)]"
      >
        {info}
      </TooltipContent>
    </Tooltip>
  );
};
