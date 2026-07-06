// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { TransactionEventProps } from '@citrineos/base';
import { Table } from '@lib/client/components/table';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import React from 'react';

type TranslateFn = (key: string, options?: any) => string;

export const getTransactionEventColumns = (translate: TranslateFn) => {
  return [
    <Table.Column
      id={TransactionEventProps.eventType}
      key={TransactionEventProps.eventType}
      accessorKey={TransactionEventProps.eventType}
      header={translate('Transactions.events.eventType')}
    />,
    <Table.Column
      id={TransactionEventProps.timestamp}
      key={TransactionEventProps.timestamp}
      accessorKey={TransactionEventProps.timestamp}
      header={translate('Transactions.events.timestamp')}
      enableSorting
      cell={({ row }) => <TimestampDisplay isoTimestamp={row.original.timestamp} />}
    />,
    <Table.Column
      id={TransactionEventProps.seqNo}
      key={TransactionEventProps.seqNo}
      accessorKey={TransactionEventProps.seqNo}
      header={translate('Transactions.events.seqNo')}
      enableSorting
    />,
    <Table.Column
      id={TransactionEventProps.triggerReason}
      key={TransactionEventProps.triggerReason}
      accessorKey={TransactionEventProps.triggerReason}
      header={translate('Transactions.events.triggerReason')}
    />,
  ];
};
