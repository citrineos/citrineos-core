// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useMemo, useState } from 'react';
import type { LocationDto } from '@citrineos/types';
import { Input } from '@lib/client/components/ui/input';
import { LocationClass } from '@lib/cls/location.dto';
import { LOCATIONS_LIST_QUERY } from '@lib/queries/locations';
import { ResourceType } from '@lib/utils/access.types';
import { useList, useTranslate } from '@refinedev/core';
import { plainToInstance } from 'class-transformer';
import { LocationMapV2 } from '@lib/client/components/map/map.v2';
import { Skeleton } from '@lib/client/components/ui/skeleton';

export interface LocationsMapProps {
  mapOnly?: boolean;
}

export const LocationsMap: React.FC<LocationsMapProps> = ({
  mapOnly = false,
}: LocationsMapProps) => {
  const [filteredLocations, setFilteredLocations] = useState<LocationDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const translate = useTranslate();

  const {
    query: { data, isLoading },
  } = useList<LocationClass>({
    resource: ResourceType.LOCATIONS,
    sorters: [
      {
        field: 'updatedAt',
        order: 'desc',
      },
    ],
    meta: {
      gqlQuery: LOCATIONS_LIST_QUERY,
    },
    queryOptions: {
      select: (data) => ({
        ...data,
        data: data.data.map((item) => plainToInstance(LocationClass, item)),
      }),
    },
  });

  const allLocations = useMemo(() => data?.data || [], [data?.data]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();

    const filtered = allLocations.filter(
      (value) =>
        value.chargingPool?.some((station) =>
          station.ocppConnectionName.includes(lowerCaseQuery),
        ) ||
        value.address?.toLowerCase().includes(lowerCaseQuery) ||
        value.name?.toLowerCase().includes(lowerCaseQuery),
    );

    setFilteredLocations(filtered);
  };

  // Process locations for rendering
  const locationsForMap = useMemo(() => {
    const locationsData = searchQuery.length > 0 ? filteredLocations : allLocations;

    // Enhance locations with custom react content for markers
    return locationsData.map((location) => {
      // Create a copy of the location with the custom React content
      const enhancedLocation = { ...location };

      // Add react content to the location's charging stations if needed
      enhancedLocation.chargingPool = enhancedLocation.chargingPool?.map((station) => ({
        ...station,
        reactContent: null, // If you need custom content for station markers
      }));

      return enhancedLocation;
    });
  }, [allLocations, filteredLocations, searchQuery]);

  if (isLoading) {
    return <Skeleton className="size-full" />;
  }

  return (
    <div className="size-full flex flex-col gap-4">
      {!mapOnly && (
        <Input
          placeholder={translate('placeholders.search')}
          value={searchQuery}
          onChange={handleSearch}
          className="max-w-md"
        />
      )}
      <LocationMapV2 locations={locationsForMap} />
    </div>
  );
};
