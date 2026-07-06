// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Card, CardContent } from '@lib/client/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import { CanAccess, useTranslate } from '@refinedev/core';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { ActionType, ChargingStationAccessType, ResourceType } from '@lib/utils/access.types';
import { EVSESList } from '@lib/client/pages/charging-stations/detail/evses/evses.list';
import { OCPPMessages } from '@lib/client/pages/charging-stations/detail/ocpp.messages';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { Table } from '@lib/client/components/table';
import { DEFAULT_SORTERS, DETAIL_TAB_STATE } from '@lib/utils/consts';
import { GET_TRANSACTION_LIST_FOR_STATION } from '@lib/queries/transactions';
import { TransactionClass } from '@lib/cls/transaction.dto';
import { AggregatedMeterValuesData } from '@lib/client/pages/charging-stations/detail/charging.station.aggregated.data';
import React from 'react';
import ChargingStationConfiguration from '@lib/client/pages/charging-stations/detail/charging.station.configuration';
import {
  getTransactionsColumns,
  transactionChargingStationLocationNameField,
  transactionStationIdField,
} from '@lib/client/pages/transactions/columns';
import { cardTabsStyle } from '@lib/client/styles/card';
import { useColumnPreferences } from '@lib/client/hooks/useColumnPreferences';
import { useQueryState } from 'nuqs';

enum ChargingStationDetailTabType {
  evses = 'evses',
  ocppMessages = 'ocppMessages',
  configuration = 'configuration',
  transactions = 'transactions',
  aggregated = 'aggregated',
}

export const ChargingStationDetailTabsCard = ({ id }: { id: number }) => {
  const translate = useTranslate();

  const { renderedVisibleColumns } = useColumnPreferences(
    getTransactionsColumns(translate).filter(
      (tc) =>
        tc.key !== transactionStationIdField &&
        tc.key !== transactionChargingStationLocationNameField,
    ),
    ResourceType.TRANSACTIONS,
  );

  const [tab, setTab] = useQueryState(DETAIL_TAB_STATE);

  return (
    <Card>
      <CardContent>
        <Tabs
          value={
            tab && tab in ChargingStationDetailTabType ? tab : ChargingStationDetailTabType.evses
          }
          onValueChange={(selectedTab: string) => setTab(selectedTab)}
        >
          <TabsList>
            <TabsTrigger value={ChargingStationDetailTabType.evses}>
              {translate('ChargingStations.tabs.evses')}
            </TabsTrigger>
            <TabsTrigger value={ChargingStationDetailTabType.ocppMessages}>
              {translate('ChargingStations.tabs.ocppMessages')}
            </TabsTrigger>
            <TabsTrigger value={ChargingStationDetailTabType.configuration}>
              {translate('ChargingStations.tabs.configuration')}
            </TabsTrigger>
            <TabsTrigger value={ChargingStationDetailTabType.transactions}>
              {translate('Transactions.Transactions')}
            </TabsTrigger>
            <TabsTrigger value={ChargingStationDetailTabType.aggregated}>
              {translate('ChargingStations.tabs.aggregatedMeterValuesData')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={ChargingStationDetailTabType.evses} className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.CHARGING_STATIONS}
              action={ActionType.ACCESS}
              params={{
                id,
                accessType: ChargingStationAccessType.TOPOLOGY,
              }}
              fallback={
                <p className="text-muted-foreground">
                  {translate('ChargingStations.tabs.noEvsesPermission')}
                </p>
              }
            >
              <EVSESList id={id} />
            </CanAccess>
          </TabsContent>

          <TabsContent value={ChargingStationDetailTabType.ocppMessages} className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.CHARGING_STATIONS}
              action={ActionType.ACCESS}
              params={{
                id,
                accessType: ChargingStationAccessType.OCPP_MESSAGES,
              }}
              fallback={
                <p className="text-muted-foreground">
                  {translate('ChargingStations.tabs.noOcppLogsPermission')}
                </p>
              }
            >
              <OCPPMessages stationId={id} />
            </CanAccess>
          </TabsContent>

          <TabsContent value={ChargingStationDetailTabType.configuration} className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.CHARGING_STATIONS}
              action={ActionType.ACCESS}
              params={{
                id,
                accessType: ChargingStationAccessType.CONFIGURATION,
              }}
              fallback={
                <p className="text-muted-foreground">
                  {translate('ChargingStations.tabs.noConfigurationsPermission')}
                </p>
              }
            >
              <ChargingStationConfiguration id={id} />
            </CanAccess>
          </TabsContent>

          <TabsContent value={ChargingStationDetailTabType.transactions} className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.TRANSACTIONS}
              action={ActionType.LIST}
              fallback={<AccessDeniedFallback />}
            >
              <Table
                refineCoreProps={{
                  resource: ResourceType.TRANSACTIONS,
                  sorters: DEFAULT_SORTERS,
                  meta: {
                    gqlQuery: GET_TRANSACTION_LIST_FOR_STATION,
                    gqlVariables: { stationId: id },
                  },
                  queryOptions: getPlainToInstanceOptions(TransactionClass),
                }}
                enableSorting
                enableFilters
                showHeader
                tableStateKey={ResourceType.TRANSACTIONS}
              >
                {renderedVisibleColumns}
              </Table>
            </CanAccess>
          </TabsContent>

          <TabsContent value={ChargingStationDetailTabType.aggregated} className={cardTabsStyle}>
            <AggregatedMeterValuesData id={id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
