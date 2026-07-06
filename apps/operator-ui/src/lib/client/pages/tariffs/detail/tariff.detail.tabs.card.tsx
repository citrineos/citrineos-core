// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useMemo } from 'react';
import type { TariffDto } from '@citrineos/base';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import { cardTabsStyle } from '@lib/client/styles/card';
import { CanAccess, useTranslate } from '@refinedev/core';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { Table } from '@lib/client/components/table';
import { DEFAULT_SORTERS } from '@lib/utils/consts';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { TransactionClass } from '@lib/cls/transaction.dto';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import {
  GET_CHARGING_STATIONS_FOR_TARIFF,
  GET_TRANSACTIONS_FOR_TARIFF,
} from '@lib/queries/tariffs';
import { getTransactionsColumns } from '@lib/client/pages/transactions/columns';
import { getChargingStationsColumns } from '@lib/client/pages/charging-stations/columns';
import { useColumnPreferences } from '../../../hooks/useColumnPreferences';

export const TariffDetailTabsCard = ({ tariff }: { tariff: TariffDto }) => {
  const translate = useTranslate();

  const { renderedVisibleColumns: renderedChargingStationColumns } = useColumnPreferences(
    getChargingStationsColumns(false, translate),
    ResourceType.CHARGING_STATIONS,
  );

  const { renderedVisibleColumns: renderedTransactionColumns } = useColumnPreferences(
    getTransactionsColumns(translate),
    ResourceType.TRANSACTIONS,
  );

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="charging-stations">
          <TabsList>
            <TabsTrigger value="charging-stations">
              {translate('ChargingStations.ChargingStations')}
            </TabsTrigger>
            <TabsTrigger value="transactions">{translate('Transactions.Transactions')}</TabsTrigger>
          </TabsList>

          <TabsContent value="charging-stations" className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.CHARGING_STATIONS}
              action={ActionType.LIST}
              fallback={<AccessDeniedFallback />}
            >
              <Table
                refineCoreProps={{
                  resource: ResourceType.CHARGING_STATIONS,
                  sorters: DEFAULT_SORTERS,
                  meta: {
                    gqlQuery: GET_CHARGING_STATIONS_FOR_TARIFF,
                    gqlVariables: { tariffId: Number(tariff.id) },
                  },
                  queryOptions: getPlainToInstanceOptions(ChargingStationClass),
                }}
                enableSorting
                enableFilters
                showHeader
              >
                {renderedChargingStationColumns}
              </Table>
            </CanAccess>
          </TabsContent>

          <TabsContent value="transactions" className={cardTabsStyle}>
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
                    gqlQuery: GET_TRANSACTIONS_FOR_TARIFF,
                    gqlVariables: { tariffId: Number(tariff.id) },
                  },
                  queryOptions: getPlainToInstanceOptions(TransactionClass),
                }}
                enableSorting
                enableFilters
                showHeader
              >
                {renderedTransactionColumns}
              </Table>
            </CanAccess>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
