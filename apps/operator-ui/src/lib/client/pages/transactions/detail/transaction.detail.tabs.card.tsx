// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Card, CardContent } from '@lib/client/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import { cardTabsStyle } from '@lib/client/styles/card';
import { CanAccess, useList, useTranslate } from '@refinedev/core';
import { ActionType, ResourceType, TransactionAccessType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { Table } from '@lib/client/components/table';
import {
  type MeterValueDto,
  MeterValueProps,
  OCPP2_0_1,
  type TransactionDto,
} from '@citrineos/base';
import { GET_AUTHORIZATIONS_BY_TRANSACTION } from '@lib/queries/authorizations';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { pageFlex } from '@lib/client/styles/page';
import { MultiSelect } from '@lib/client/components/multi-select';
import { ChartsWrapper } from '@lib/client/pages/transactions/chart/charts.wrapper';
import { TransactionEventsList } from '@lib/client/pages/transactions/detail/transaction-events/transaction.events.list';
import { OCPPMessages } from '@lib/client/pages/charging-stations/detail/ocpp.messages';
import { GET_METER_VALUES_FOR_TRANSACTION } from '@lib/queries/meter.values';
import { MeterValueClass } from '@lib/cls/meter.value.dto';
import { useState } from 'react';
import { AuthorizationClass } from '@lib/cls/authorization.dto';
import { useColumnPreferences } from '@lib/client/hooks/useColumnPreferences';
import { getAuthorizationsColumns } from '@lib/client/pages/authorizations/columns';
import { useQueryState } from 'nuqs';
import { DETAIL_TAB_STATE } from '@lib/utils/consts';

enum TransactionDetailTabType {
  authorizations = 'authorizations',
  meterValues = 'meterValues',
  events = 'events',
  ocppMessages = 'ocppMessages',
}

const twoMinutesInMs = 2 * 60 * 1000;

export const TransactionDetailTabsCard = ({ transaction }: { transaction: TransactionDto }) => {
  const translate = useTranslate();

  const [validContexts, setValidContexts] = useState<OCPP2_0_1.ReadingContextEnumType[]>([
    OCPP2_0_1.ReadingContextEnumType.Transaction_Begin,
    OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
    OCPP2_0_1.ReadingContextEnumType.Transaction_End,
  ]);

  const {
    query: { data: meterValuesData },
  } = useList<MeterValueDto>({
    resource: ResourceType.METER_VALUES,
    meta: {
      gqlQuery: GET_METER_VALUES_FOR_TRANSACTION,
      gqlVariables: {
        limit: 10000,
        transactionDatabaseId: Number(transaction.id),
      },
    },
    sorters: [{ field: MeterValueProps.timestamp, order: 'asc' }],
    queryOptions: getPlainToInstanceOptions(MeterValueClass),
  });
  const meterValues = meterValuesData?.data ?? [];

  const authorization = transaction?.authorization;

  const { renderedVisibleColumns } = useColumnPreferences(
    getAuthorizationsColumns(translate),
    ResourceType.AUTHORIZATIONS,
  );

  const [tab, setTab] = useQueryState(DETAIL_TAB_STATE);

  return (
    <Card>
      <CardContent>
        <Tabs
          value={
            tab && tab in TransactionDetailTabType ? tab : TransactionDetailTabType.authorizations
          }
          onValueChange={(selectedTab: string) => setTab(selectedTab)}
        >
          <TabsList>
            <TabsTrigger value={TransactionDetailTabType.authorizations}>
              {translate('Authorizations.Authorizations')}
            </TabsTrigger>
            <TabsTrigger value={TransactionDetailTabType.meterValues}>
              {translate('Transactions.tabs.meterValueData')}
            </TabsTrigger>
            <TabsTrigger value={TransactionDetailTabType.events}>
              {translate('Transactions.tabs.events')}
            </TabsTrigger>
            <TabsTrigger value={TransactionDetailTabType.ocppMessages}>
              {translate('Transactions.tabs.ocppMessages')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={TransactionDetailTabType.authorizations} className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.AUTHORIZATIONS}
              action={ActionType.LIST}
              fallback={<AccessDeniedFallback />}
            >
              <Table
                refineCoreProps={{
                  resource: ResourceType.AUTHORIZATIONS,
                  meta: {
                    gqlQuery: GET_AUTHORIZATIONS_BY_TRANSACTION,
                    gqlVariables: {
                      id: authorization?.id,
                      offset: 0,
                      limit: 10,
                      order_by: [],
                    },
                  },
                  queryOptions: {
                    ...getPlainToInstanceOptions(AuthorizationClass),
                    select: (data: any) => {
                      return data;
                    },
                  },
                }}
                enableSorting
                enableFilters
                showHeader
                tableStateKey={ResourceType.AUTHORIZATIONS}
              >
                {renderedVisibleColumns}
              </Table>
            </CanAccess>
          </TabsContent>

          <TabsContent value={TransactionDetailTabType.meterValues} className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.TRANSACTIONS}
              action={ActionType.ACCESS}
              fallback={<AccessDeniedFallback />}
              params={{
                id: transaction.id,
                accessType: TransactionAccessType.EVENTS,
              }}
            >
              <div className={pageFlex}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">
                    {translate('Transactions.tabs.contexts')}
                  </label>
                  <MultiSelect<OCPP2_0_1.ReadingContextEnumType>
                    options={Object.values(OCPP2_0_1.ReadingContextEnumType)}
                    selectedValues={validContexts}
                    setSelectedValues={setValidContexts}
                    placeholder={translate('Transactions.tabs.selectReadingContexts')}
                    searchPlaceholder={translate('Transactions.tabs.searchReadingContexts')}
                  />
                </div>

                <ChartsWrapper meterValues={meterValues} validContexts={validContexts} />
              </div>
            </CanAccess>
          </TabsContent>

          <TabsContent value={TransactionDetailTabType.events} className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.TRANSACTIONS}
              action={ActionType.ACCESS}
              fallback={<AccessDeniedFallback />}
              params={{
                id: transaction.id,
                accessType: TransactionAccessType.EVENTS,
              }}
            >
              <TransactionEventsList
                transactionDatabaseId={transaction.id}
                ocppTransactionId={
                  transaction.transactionId ? Number(transaction.transactionId) : undefined
                }
                ocppConnectionName={transaction.ocppConnectionName}
              />
            </CanAccess>
          </TabsContent>

          <TabsContent value={TransactionDetailTabType.ocppMessages} className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.TRANSACTIONS}
              action={ActionType.ACCESS}
              fallback={<AccessDeniedFallback />}
              params={{
                id: transaction.id,
                accessType: TransactionAccessType.EVENTS,
              }}
            >
              <OCPPMessages
                stationId={transaction.stationId}
                initialStartDate={
                  transaction.startTime
                    ? new Date(new Date(transaction.startTime).getTime() - twoMinutesInMs)
                    : null
                }
                initialEndDate={
                  transaction.endTime
                    ? new Date(new Date(transaction.endTime).getTime() + twoMinutesInMs)
                    : new Date()
                }
              />
            </CanAccess>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
