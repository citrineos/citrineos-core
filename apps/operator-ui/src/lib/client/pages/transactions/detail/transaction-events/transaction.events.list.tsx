// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { TransactionEventDto } from '@citrineos/base';
import { TransactionEventEnum, TransactionEventProps } from '@citrineos/base';
import { Table } from '@lib/client/components/table';
import { MeterValuesList } from '@lib/client/pages/transactions/detail/meter-values/meter.values.list';
import { getTransactionEventColumns } from '@lib/client/pages/transactions/detail/transaction-events/columns';
import { OCPPMessageClass } from '@lib/cls/ocpp.message.dto';
import { TransactionEventClass } from '@lib/cls/transaction.event.dto';
import { GET_OCPP_MESSAGES_FOR_TRANSACTION_LIST_QUERY } from '@lib/queries/ocpp.messages';
import {
  GET_TRANSACTION_EVENTS_FOR_TRANSACTION_LIST_QUERY,
  TRANSACTION_EVENT_LIST_QUERY,
} from '@lib/queries/transaction.events';
import { ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { useList, useTranslate } from '@refinedev/core';
import { ChevronDownIcon } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { ExpandedState } from '@tanstack/react-table';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export const TransactionEventsList = ({
  transactionDatabaseId,
  ocppTransactionId,
  ocppConnectionName,
}: any) => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const translate = useTranslate();

  const tenantId = useTenantId();

  const {
    query: { data: eventsData },
  } = useList<TransactionEventDto>({
    resource: ResourceType.TRANSACTION_EVENTS,
    sorters: [{ field: TransactionEventProps.timestamp, order: 'desc' }],
    meta: {
      gqlQuery: transactionDatabaseId
        ? GET_TRANSACTION_EVENTS_FOR_TRANSACTION_LIST_QUERY
        : TRANSACTION_EVENT_LIST_QUERY,
      gqlVariables: transactionDatabaseId ? { transactionDatabaseId } : undefined,
    },
    queryOptions: getPlainToInstanceOptions(TransactionEventClass),
    pagination: { pageSize: 1000 },
  });

  const {
    query: { data: messagesData },
  } = useList<OCPPMessageClass>({
    resource: ResourceType.OCPP_MESSAGES,
    sorters: [{ field: 'timestamp', order: 'desc' }],
    meta: {
      gqlQuery: GET_OCPP_MESSAGES_FOR_TRANSACTION_LIST_QUERY,
      gqlVariables: { ocppTransactionId, ocppConnectionName },
    },
    queryOptions: getPlainToInstanceOptions(OCPPMessageClass),
    pagination: { pageSize: 1000 },
  });

  const merged = useMemo<TransactionEventDto[]>(() => {
    const events = eventsData?.data || [];
    const messages = (messagesData?.data || []) as any[];

    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const messageRows: TransactionEventDto[] = sortedMessages.map((m, index) => {
      const payload = m.message?.[3];
      const triggerReason: string = m.action === 'StopTransaction' ? (payload?.reason ?? '') : '';

      const innerMeterValues: any[] =
        m.action === 'MeterValues'
          ? (payload?.meterValue ?? [])
          : m.action === 'StopTransaction'
            ? (payload?.transactionData ?? [])
            : [];

      const meterValueTimestamps: string[] = innerMeterValues
        .map((mv: any) => mv.timestamp)
        .filter(Boolean);

      return {
        id: -m.id,
        ocppConnectionName: String(m.ocppConnectionName ?? ''),
        evseId: payload?.connectorId ?? null,
        transactionDatabaseId: transactionDatabaseId,
        eventType: m.action as TransactionEventDto['eventType'],
        meterValues: innerMeterValues,
        timestamp: String(m.timestamp),
        triggerReason: triggerReason as TransactionEventDto['triggerReason'],
        seqNo: (index + 1) as TransactionEventDto['seqNo'],
        offline: false as TransactionEventDto['offline'],
        numberOfPhasesUsed: 0 as TransactionEventDto['numberOfPhasesUsed'],
        cableMaxCurrent: 0 as TransactionEventDto['cableMaxCurrent'],
        reservationId: 0 as TransactionEventDto['reservationId'],
        tenantId,
        _meterValueTimestamps: meterValueTimestamps,
      } as any;
    });
    return [...events, ...messageRows].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [eventsData?.data, messagesData?.data, transactionDatabaseId, tenantId]);

  const columns = [
    ...getTransactionEventColumns(translate),
    <Table.Column
      id="meterValues"
      key="meterValues"
      accessorKey={TransactionEventProps.meterValue}
      header=""
      cell={({ row }) =>
        row.original.eventType! in TransactionEventEnum ||
        (row.original.meterValues as any[])?.length > 0 ? (
          <div
            className="flex items-center justify-end cursor-pointer hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
          >
            <span className="text-sm">{translate('Transactions.events.viewMeterValues')}</span>
            <ChevronDownIcon
              className={`transition-transform duration-200 ${
                row.getIsExpanded() ? 'rotate-180' : ''
              }`}
            />
          </div>
        ) : null
      }
    />,
  ];

  return (
    <div className="space-y-4">
      <Table
        refineCoreProps={{
          resource: ResourceType.TRANSACTION_EVENTS,
          sorters: {
            initial: [{ field: TransactionEventProps.timestamp, order: 'desc' }],
          },
          meta: {
            gqlQuery: transactionDatabaseId
              ? GET_TRANSACTION_EVENTS_FOR_TRANSACTION_LIST_QUERY
              : TRANSACTION_EVENT_LIST_QUERY,
            gqlVariables: transactionDatabaseId ? { transactionDatabaseId } : undefined,
          },
          queryOptions: {
            ...getPlainToInstanceOptions(TransactionEventClass),
            select: () => ({ data: merged, total: merged.length }),
          },
        }}
        expandable={{
          expandedRowKeys: expanded,
          onExpandedRowsChange: (updaterOrValue) => {
            const newExpanded =
              typeof updaterOrValue === 'function' ? updaterOrValue(expanded) : updaterOrValue;
            setExpanded(newExpanded);
          },
          expandedRowRender: (record: TransactionEventDto) => (
            <div className="border-t bg-muted/20 p-4">
              <MeterValuesList
                transactionEventId={record.id != null && record.id > 0 ? record.id : undefined}
                transactionDatabaseId={
                  record.id != null && record.id < 0 ? transactionDatabaseId : undefined
                }
                meterValueTimestamps={(record as any)._meterValueTimestamps}
              />
            </div>
          ),
          expandedRowClassName: 'bg-muted/10',
        }}
        enableSorting
        enableFilters
        showHeader
        tableStateKey={ResourceType.TRANSACTION_EVENTS}
      >
        {columns}
      </Table>
    </div>
  );
};
