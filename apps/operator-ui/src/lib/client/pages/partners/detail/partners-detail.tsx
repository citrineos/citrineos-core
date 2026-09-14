// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { TenantPartnerClass } from '@lib/cls/tenant-partner-cls';
import { PARTNER_DETAIL_QUERY } from '@lib/queries/tenant-partners';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useOne, useTranslate } from '@refinedev/core';
import { PartnerDetailCard } from '@lib/client/pages/partners/detail/partner-detail-card';
import type { TenantPartnerDto } from '@citrineos/types';
import { PartnerDetailTabsCard } from '@lib/client/pages/partners/detail/partner-detail-tabs-card';
import { pageFlex, pageMargin } from '@lib/client/styles/page';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { NoDataFoundCard } from '@lib/client/components/no-data-found-card';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import React from 'react';

type PartnersDetailProps = {
  params: { id: string };
};

export const PartnersDetail = ({ params }: PartnersDetailProps) => {
  const { id } = params;
  const translate = useTranslate();

  const {
    query: { data, isLoading },
  } = useOne<TenantPartnerClass>({
    resource: ResourceType.PARTNERS,
    id,
    meta: {
      gqlQuery: PARTNER_DETAIL_QUERY,
    },
    queryOptions: getPlainToInstanceOptions(TenantPartnerClass, true),
  });

  const tenantPartner = data?.data as TenantPartnerDto;

  if (isLoading) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <Skeleton className="h-50 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  } else if (!tenantPartner) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <NoDataFoundCard message={translate('TenantPartners.noDataFound', { id })} />
      </div>
    );
  }

  return (
    <CanAccess
      resource={ResourceType.PARTNERS}
      action={ActionType.SHOW}
      params={{ id }}
      fallback={
        <div className={`${pageMargin} ${pageFlex}`}>
          <AccessDeniedFallbackCard />
        </div>
      }
    >
      <div className={`${pageMargin} ${pageFlex}`}>
        <PartnerDetailCard tenantPartner={tenantPartner} />
        <PartnerDetailTabsCard tenantPartner={tenantPartner} />
      </div>
    </CanAccess>
  );
};
