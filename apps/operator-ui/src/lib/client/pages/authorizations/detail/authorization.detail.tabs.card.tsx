// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import { CanAccess } from '@refinedev/core';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { Table } from '@lib/client/components/table';
import { GET_TRANSACTIONS_FOR_AUTHORIZATION } from '@lib/queries/transactions';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { TransactionClass } from '@lib/cls/transaction.dto';
import type { AuthorizationDto } from '@citrineos/base';
import {
  getTransactionsColumns,
  transactionAuthorizationIdTokenField,
} from '@lib/client/pages/transactions/columns';
import { cardTabsStyle } from '@lib/client/styles/card';
import { useColumnPreferences } from '@lib/client/hooks/useColumnPreferences';
import { useTranslate } from '@refinedev/core';

export const AuthorizationDetailTabsCard = ({
  authorization,
}: {
  authorization: AuthorizationDto;
}) => {
  const translate = useTranslate();
  const authIdToken = authorization?.idToken;

  const { renderedVisibleColumns } = useColumnPreferences(
    getTransactionsColumns(translate).filter(
      (tc) => tc.key !== transactionAuthorizationIdTokenField,
    ),
    ResourceType.TRANSACTIONS,
  );

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">{translate('Transactions.Transactions')}</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className={cardTabsStyle}>
            <CanAccess
              resource={ResourceType.TRANSACTIONS}
              action={ActionType.LIST}
              fallback={<AccessDeniedFallback />}
            >
              <Table
                refineCoreProps={{
                  resource: ResourceType.TRANSACTIONS,
                  meta: {
                    gqlQuery: GET_TRANSACTIONS_FOR_AUTHORIZATION,
                    gqlVariables: {
                      limit: 10000,
                      id: authorization?.id,
                    },
                  },
                  queryOptions: {
                    enabled: !!authIdToken,
                    ...getPlainToInstanceOptions(TransactionClass),
                  },
                }}
                enableSorting
                enableFilters
                showHeader
              >
                {renderedVisibleColumns}
              </Table>
            </CanAccess>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
