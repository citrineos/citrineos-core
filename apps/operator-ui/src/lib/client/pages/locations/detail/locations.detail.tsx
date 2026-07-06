// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { LocationDto } from '@citrineos/base';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import { LocationsChargingStationsTable } from '@lib/client/pages/locations/list/locations.charging.stations.table';
import { OpeningHoursDisplay } from '@lib/client/components/opening-hours';
import { LocationClass } from '@lib/cls/location.dto';
import { LOCATIONS_GET_QUERY } from '@lib/queries/locations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useOne, useTranslate } from '@refinedev/core';
import { pageFlex, pageMargin } from '@lib/client/styles/page';
import { LocationDetailCard } from '@lib/client/pages/locations/detail/location.detail.card';
import React, { useState, useEffect } from 'react';
import { S3_BUCKET_FOLDER_IMAGES_LOCATIONS } from '@lib/utils/consts';
import { getPresignedUrlForGet } from '@lib/server/actions/file/getPresingedUrlForGet';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { NoDataFoundCard } from '@lib/client/components/no-data-found-card';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';

type LocationDetailProps = {
  params: { id: string };
};

export const LocationsDetail = ({ params }: LocationDetailProps) => {
  const { id } = params;
  const {
    query: { data, isLoading },
  } = useOne<LocationDto>({
    resource: ResourceType.LOCATIONS,
    id,
    meta: {
      gqlQuery: LOCATIONS_GET_QUERY,
    },
    queryOptions: getPlainToInstanceOptions(LocationClass, true),
  });

  const location = data?.data;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const translate = useTranslate();

  useEffect(() => {
    if (location?.id) {
      getPresignedUrlForGet(`${S3_BUCKET_FOLDER_IMAGES_LOCATIONS}/${location.id}`).then(
        (result) => {
          if (result.success) {
            return setImageUrl(result.data);
          }
        },
      );
    }
  }, [location?.id]);

  if (isLoading) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <Skeleton className="h-50 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  } else if (!location) {
    return (
      <div className={`${pageMargin} ${pageFlex}`}>
        <NoDataFoundCard message={translate('Locations.noDataFound', { id })} />
      </div>
    );
  }

  return (
    <CanAccess
      resource={ResourceType.LOCATIONS}
      action={ActionType.SHOW}
      params={{ id: location.id }}
      fallback={
        <div className={`${pageMargin} ${pageFlex}`}>
          <AccessDeniedFallbackCard />
        </div>
      }
    >
      <div className={`${pageMargin} ${pageFlex}`}>
        <LocationDetailCard location={location} imageUrl={imageUrl} />

        <Card>
          <CardContent>
            <Tabs defaultValue="charging-stations">
              <TabsList>
                <TabsTrigger value="charging-stations">
                  {translate('Locations.chargingStations')}
                </TabsTrigger>
                <TabsTrigger value="opening-hours">
                  {translate('Locations.openingHours')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="charging-stations">
                <LocationsChargingStationsTable location={location} showHeader />
              </TabsContent>
              <TabsContent value="opening-hours">
                <OpeningHoursDisplay openingHours={location.openingHours} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </CanAccess>
  );
};
