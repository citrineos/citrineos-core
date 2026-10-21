// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { NetworkAlertDetailCard } from '@lib/client/pages/network-alerts/detail/network-alert-detail-card';
import { NetworkAlertDetailTabsCard } from '@lib/client/pages/network-alerts/detail/network-alert-detail-tabs-card';
import { NetworkAlertClass, type NetworkAlertWithRelationsDto } from '@lib/cls/network-alert-dto';
import { NETWORK_ALERT_GET_QUERY } from '@lib/queries/network-alerts';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useOne, useTranslate } from '@refinedev/core';
import { pageFlex, pageMargin } from '@lib/client/styles/page';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { NoDataFoundCard } from '@lib/client/components/no-data-found-card';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import React from 'react';

type NetworkAlertDetailProps = {
  params: { id: string };
};

export const NetworkAlertDetail = ({ params }: NetworkAlertDetailProps) => {
  const { id } = params;
  const translate = useTranslate();

  const {
    query: { data, isLoading },
  } = useOne<NetworkAlertWithRelationsDto>({
    resource: ResourceType.NETWORK_ALERTS,
    id,
    liveMode: 'auto',
    meta: { gqlQuery: NETWORK_ALERT_GET_QUERY },
    queryOptions: getPlainToInstanceOptions(NetworkAlertClass, true),
  });
  const alert = data?.data;

  if (isLoading) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <Skeleton className="h-50 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  } else if (!alert) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <NoDataFoundCard message={translate('NetworkAlerts.noDataFound', { id })} />
      </div>
    );
  }

  return (
    <CanAccess
      resource={ResourceType.NETWORK_ALERTS}
      action={ActionType.SHOW}
      params={{ id }}
      fallback={
        <div className={`${pageMargin} ${pageFlex}`}>
          <AccessDeniedFallbackCard />
        </div>
      }
    >
      <div className={`${pageMargin} ${pageFlex}`}>
        <NetworkAlertDetailCard alert={alert} />
        <NetworkAlertDetailTabsCard alert={alert} />
      </div>
    </CanAccess>
  );
};
