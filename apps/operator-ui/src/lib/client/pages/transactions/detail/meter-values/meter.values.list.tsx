// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { MeterValueProps, type MeterValueDto } from '@citrineos/base';
import { Table } from '@lib/client/components/table';
import { getMeterValueColumns } from '@lib/client/pages/transactions/detail/meter-values/columns';
import { SampledValuesListView } from '@lib/client/pages/transactions/detail/meter-values/sampled.values.list';
import { TransactionEventClass } from '@lib/cls/transaction.event.dto';
import {
  GET_METER_VALUES_FOR_TRANSACTION,
  GET_METER_VALUES_FOR_TRANSACTION_EVENT,
  METER_VALUE_LIST_QUERY,
} from '@lib/queries/meter.values';
import { ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { useTranslate } from '@refinedev/core';
import type { ExpandedState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

const VALID_CONTEXTS = new Set(['Transaction.Begin', 'Sample.Periodic', 'Transaction.End']);

export const MeterValuesList = ({
  transactionEventId,
  transactionDatabaseId,
  meterValueTimestamps,
}: any) => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const translate = useTranslate();
  const columns = useMemo(() => getMeterValueColumns(translate), [translate]);

  return (
    <Table
      refineCoreProps={{
        resource: ResourceType.METER_VALUES,
        sorters: {
          initial: [{ field: MeterValueProps.timestamp, order: 'desc' }],
        },
        meta: {
          gqlQuery: transactionEventId
            ? GET_METER_VALUES_FOR_TRANSACTION_EVENT
            : transactionDatabaseId
              ? GET_METER_VALUES_FOR_TRANSACTION
              : METER_VALUE_LIST_QUERY,
          gqlVariables: transactionEventId
            ? { transactionEventId }
            : transactionDatabaseId
              ? {
                  transactionDatabaseId,
                  ...(meterValueTimestamps?.length
                    ? { where: { timestamp: { _in: meterValueTimestamps } } }
                    : {}),
                }
              : undefined,
        },
        queryOptions: transactionDatabaseId
          ? {
              select: (data: any) => ({
                ...data,
                data: (data.data ?? []).filter((mv: any) =>
                  (mv.sampledValue as any[])?.some((sv: any) => VALID_CONTEXTS.has(sv.context)),
                ),
              }),
            }
          : getPlainToInstanceOptions(TransactionEventClass),
      }}
      expandable={{
        expandedRowKeys: expanded,
        onExpandedRowsChange: (updaterOrValue) => {
          const newExpanded =
            typeof updaterOrValue === 'function' ? updaterOrValue(expanded) : updaterOrValue;
          setExpanded(newExpanded);
        },
        expandedRowRender: (record: MeterValueDto) => (
          <div className="border-t bg-muted/20 p-4">
            <SampledValuesListView sampledValues={record.sampledValue} />
          </div>
        ),
        expandedRowClassName: 'bg-muted/10',
      }}
      enableSorting
      showHeader
    >
      {columns}
    </Table>
  );
};
