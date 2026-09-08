// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useEffect, useState } from 'react';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import { CanAccess } from '@refinedev/core';
import { ChargingStationDetailCard } from '@lib/client/pages/charging-stations/detail/charging-station-detail-card';
import { pageFlex, pageMargin } from '@lib/client/styles/page';
import { ChargingStationDetailTabsCard } from '@lib/client/pages/charging-stations/detail/charging-station-detail-tabs-card';
import { S3_BUCKET_FOLDER_IMAGES_CHARGING_STATIONS } from '@lib/utils/consts';
import { getPresignedUrlForGet } from '@lib/server/actions/file/get-presinged-url-for-get';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import { Skeleton } from '@lib/client/components/ui/skeleton';

type ChargingStationDetailProps = {
  params: { id: number };
};

export const ChargingStationDetail: React.FC<ChargingStationDetailProps> = ({ params }) => {
  const { id } = params;
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getPresignedUrlForGet(`${S3_BUCKET_FOLDER_IMAGES_CHARGING_STATIONS}/${id}`).then((result) => {
        if (result.success) {
          return setImageUrl(result.data);
        }
      });
    }
  }, [id]);

  if (!id) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <Skeleton className="h-50 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <CanAccess
      resource={ResourceType.CHARGING_STATIONS}
      action={ActionType.SHOW}
      params={{ id }}
      fallback={
        <div className={`${pageMargin} ${pageFlex}`}>
          <AccessDeniedFallbackCard />
        </div>
      }
    >
      <div className={`${pageMargin} ${pageFlex}`}>
        <ChargingStationDetailCard id={id} imageUrl={imageUrl} />
        <ChargingStationDetailTabsCard id={id} />
      </div>
    </CanAccess>
  );
};
