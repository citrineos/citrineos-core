// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { MeterValueProps } from '@citrineos/base';
import { Table } from '@lib/client/components/table';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import { ChevronDownIcon } from 'lucide-react';

type TranslateFn = (key: string, options?: any) => string;

export const getMeterValueColumns = (translate: TranslateFn) => {
  return [
    <Table.Column
      id={MeterValueProps.id}
      key={MeterValueProps.id}
      accessorKey={MeterValueProps.id}
      header={translate('Transactions.meterValues.id')}
      enableSorting
    />,
    <Table.Column
      id={MeterValueProps.timestamp}
      key={MeterValueProps.timestamp}
      accessorKey={MeterValueProps.timestamp}
      header={translate('Transactions.meterValues.timestamp')}
      cell={({ row }) => <TimestampDisplay isoTimestamp={row.original.timestamp} />}
    />,
    <Table.Column
      id={MeterValueProps.sampledValue}
      key={MeterValueProps.sampledValue}
      header=""
      cell={({ row }) => (
        <div
          className="flex items-center justify-end gap-2 cursor-pointer hover:text-primary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          <span className="text-sm">{translate('Transactions.meterValues.sampleValues')}</span>
          <ChevronDownIcon
            className={`transition-transform duration-200 ${
              row.getIsExpanded() ? 'rotate-180' : ''
            }`}
          />
        </div>
      )}
    />,
  ];
};
