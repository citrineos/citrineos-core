// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { TransactionDto } from '@citrineos/types';
import { TransactionDetailCard } from '@lib/client/pages/transactions/detail/transaction-detail-card';
import { TransactionClass } from '@lib/cls/transaction-dto';
import { TRANSACTION_GET_QUERY } from '@lib/queries/transactions';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useOne, useTranslate } from '@refinedev/core';
import { pageFlex, pageMargin } from '@lib/client/styles/page';
import { TransactionDetailTabsCard } from '@lib/client/pages/transactions/detail/transaction-detail-tabs-card';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { NoDataFoundCard } from '@lib/client/components/no-data-found-card';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import React from 'react';

type TransactionDetailProps = {
  params: { id: string };
};

export const TransactionDetail = ({ params }: TransactionDetailProps) => {
  const { id } = params;
  const translate = useTranslate();

  const {
    query: { data: transactionData, isLoading },
  } = useOne<TransactionDto>({
    resource: ResourceType.TRANSACTIONS,
    id,
    meta: { gqlQuery: TRANSACTION_GET_QUERY },
    queryOptions: getPlainToInstanceOptions(TransactionClass, true),
  });
  const transaction = transactionData?.data;

  if (isLoading) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <Skeleton className="h-50 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  } else if (!transaction) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <NoDataFoundCard message={translate('Transactions.noDataFound', { id })} />
      </div>
    );
  }

  return (
    <CanAccess
      resource={ResourceType.TRANSACTIONS}
      action={ActionType.SHOW}
      params={{ id: transaction.id }}
      fallback={
        <div className={`${pageMargin} ${pageFlex}`}>
          <AccessDeniedFallbackCard />
        </div>
      }
    >
      <div className={`${pageMargin} ${pageFlex}`}>
        <TransactionDetailCard transaction={transaction} />
        <TransactionDetailTabsCard transaction={transaction} />
      </div>
    </CanAccess>
  );
};
