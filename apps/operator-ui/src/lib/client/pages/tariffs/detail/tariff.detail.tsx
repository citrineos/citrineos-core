// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { TariffDto } from '@citrineos/types';
import { TariffDetailCard } from '@lib/client/pages/tariffs/detail/tariff.detail.card';
import { TariffDetailTabsCard } from '@lib/client/pages/tariffs/detail/tariff.detail.tabs.card';
import { TariffClass } from '@lib/cls/tariff.dto';
import { TARIFF_GET_QUERY } from '@lib/queries/tariffs';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useOne, useTranslate } from '@refinedev/core';
import { pageFlex, pageMargin } from '@lib/client/styles/page';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { NoDataFoundCard } from '@lib/client/components/no-data-found-card';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import React from 'react';

type TariffDetailProps = {
  params: { id: string };
};

export const TariffDetail = ({ params }: TariffDetailProps) => {
  const { id } = params;
  const translate = useTranslate();

  const {
    query: { data: tariffData, isLoading },
  } = useOne<TariffDto>({
    resource: ResourceType.TARIFFS,
    id,
    meta: { gqlQuery: TARIFF_GET_QUERY },
    queryOptions: getPlainToInstanceOptions(TariffClass, true),
  });
  const tariff = tariffData?.data;

  if (isLoading) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <Skeleton className="h-50 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  } else if (!tariff) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <NoDataFoundCard message={translate('Tariffs.noDataFound', { id })} />
      </div>
    );
  }

  return (
    <CanAccess
      resource={ResourceType.TARIFFS}
      action={ActionType.SHOW}
      params={{ id: tariff.id }}
      fallback={
        <div className={`${pageMargin} ${pageFlex}`}>
          <AccessDeniedFallbackCard />
        </div>
      }
    >
      <div className={`${pageMargin} ${pageFlex}`}>
        <TariffDetailCard tariff={tariff} />
        <TariffDetailTabsCard tariff={tariff} />
      </div>
    </CanAccess>
  );
};
