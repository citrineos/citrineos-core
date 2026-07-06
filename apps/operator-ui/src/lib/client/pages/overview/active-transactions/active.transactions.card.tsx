// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { TransactionDto } from '@citrineos/base';
import { BaseProps, TransactionProps } from '@citrineos/base';
import { Combobox } from '@lib/client/components/combobox';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { TransactionClass } from '@lib/cls/transaction.dto';
import { TRANSACTION_LIST_QUERY } from '@lib/queries/transactions';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useList, useTranslate } from '@refinedev/core';
import { ChevronRightIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { clickableLinkStyle, heading2Style } from '@lib/client/styles/page';
import { overviewClickableStyle } from '@lib/client/styles/card';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';

export const ActiveTransactionsCard = () => {
  const { push } = useRouter();
  const translate = useTranslate();
  const [searchFilters, setSearchFilters] = useState<any[]>([]);

  const {
    query: { data, isLoading, isError },
  } = useList<TransactionDto>({
    resource: ResourceType.TRANSACTIONS,
    meta: {
      gqlQuery: TRANSACTION_LIST_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 3,
        where: { isActive: { _eq: true } },
      },
    },
    queryOptions: getPlainToInstanceOptions(TransactionClass),
    sorters: [{ field: BaseProps.updatedAt, order: 'desc' }],
    pagination: {
      mode: 'off',
    },
  });

  const {
    query: { data: searchData },
  } = useList<TransactionDto>({
    resource: ResourceType.TRANSACTIONS,
    filters: searchFilters,
    meta: {
      gqlQuery: TRANSACTION_LIST_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 5,
        where: { isActive: { _eq: true } },
      },
    },
    queryOptions: {
      ...getPlainToInstanceOptions(TransactionClass),
      enabled: searchFilters.length > 0,
    },
    sorters: [{ field: BaseProps.updatedAt, order: 'desc' }],
    pagination: { mode: 'off' },
  });

  const handleSearch = (value: string) => {
    if (!value) {
      setSearchFilters([]);
      return;
    }
    setSearchFilters([
      {
        operator: 'and',
        value: [
          {
            field: TransactionProps.transactionId,
            operator: 'contains',
            value,
          },
        ],
      },
    ]);
  };

  const searchResults = searchData?.data || [];
  const transactions = data?.data ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return <Skeleton className="size-full" />;
  }

  return (
    <CanAccess
      resource={ResourceType.TRANSACTIONS}
      action={ActionType.LIST}
      fallback={<AccessDeniedFallbackCard />}
    >
      <Card className="h-full overflow-scroll">
        <CardHeader>
          <div className="flex justify-between">
            <h2 className={heading2Style}>
              {translate('Overview.activeTransactions')} ({total})
            </h2>
            <div
              className={overviewClickableStyle}
              onClick={() => push(`/${MenuSection.TRANSACTIONS}`)}
            >
              {translate('Overview.viewAllTransactions')} <ChevronRightIcon />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p>{translate('Overview.errorLoadingData')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="max-w-md">
                <Combobox<number>
                  options={searchResults.map((tx) => ({
                    label: tx.transactionId,
                    value: tx.id!,
                  }))}
                  onSelect={(id) => push(`/${MenuSection.TRANSACTIONS}/${id}`)}
                  onSearch={handleSearch}
                  placeholder={translate('placeholders.search')}
                />
              </div>

              <div className="flex flex-col">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div className="flex flex-col mb-4" key={transaction.id}>
                      <div
                        className={clickableLinkStyle}
                        onClick={() => push(`/${MenuSection.TRANSACTIONS}/${transaction.id}`)}
                      >
                        <span className="link">{transaction.transactionId}</span>
                      </div>

                      <div>
                        {translate('Overview.stationLabel', {
                          value: transaction.ocppConnectionName,
                        })}
                      </div>
                      <div>
                        {translate('Overview.totalKwh', {
                          value: transaction.totalKwh?.toFixed(2),
                        })}
                      </div>
                      <div>
                        {translate('Overview.totalTime', { value: transaction.timeSpentCharging })}
                      </div>
                      <div>
                        {translate('Overview.transactionStatus', {
                          value: transaction.chargingState,
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <span>{translate('Overview.noActiveTransactions')}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </CanAccess>
  );
};
