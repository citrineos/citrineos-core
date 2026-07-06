// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LocationDto } from '@citrineos/base';
import { LocationMap } from '@lib/client/components/map/map';
import { Button } from '@lib/client/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@lib/client/components/ui/tooltip';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { LocationClass } from '@lib/cls/location.dto';
import { CHARGING_STATIONS_LIST_QUERY } from '@lib/queries/charging.stations';
import { LOCATIONS_LIST_QUERY } from '@lib/queries/locations';
import { ResourceType } from '@lib/utils/access.types';
import { useList, useTranslate } from '@refinedev/core';
import { plainToInstance } from 'class-transformer';
import React, { useState } from 'react';

export interface CombinedMapProps {
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
}

export const CombinedMap: React.FC<CombinedMapProps> = ({
  defaultCenter = { lat: 36.7783, lng: -119.4179 },
  defaultZoom = 6,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'locations' | 'stations'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'location' | 'station' | 'mixed' | null>(null);
  const translate = useTranslate();

  const {
    query: { data: locationsData },
  } = useList<LocationDto>({
    resource: ResourceType.LOCATIONS,
    meta: {
      gqlQuery: LOCATIONS_LIST_QUERY,
    },
    queryOptions: {
      select: (data) => ({
        ...data,
        data: data.data.map((item) => plainToInstance(LocationClass, item)) as LocationDto[],
      }),
    },
  });

  const {
    query: { data: stationsData },
  } = useList<ChargingStationClass>({
    resource: ResourceType.CHARGING_STATIONS,
    meta: {
      gqlQuery: CHARGING_STATIONS_LIST_QUERY,
    },
    queryOptions: {
      select: (data) => ({
        ...data,
        data: data.data.map((item) => plainToInstance(ChargingStationClass, item)),
      }),
    },
  });

  const locations = locationsData?.data || [];
  const stations = stationsData?.data || [];

  // Handle marker click
  const handleMarkerClick = (id: string, type: 'station' | 'location' | 'mixed') => {
    setSelectedId(id);
    setSelectedType(type);

    // Optionally navigate to the details page
    // if (type === 'location') {
    //   window.location.href = `/locations/${id}`;
    // } else {
    //   window.location.href = `/charging-stations/${id}`;
    // }
  };

  return (
    <div className="combined-map-container">
      <div className="map-controls flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{translate('Locations.map.networkOverview')}</h2>
        <div className="flex items-center gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'all' | 'locations' | 'stations')}
          >
            <TabsList>
              <TabsTrigger value="all">{translate('Locations.map.all')}</TabsTrigger>
              <TabsTrigger value="locations">{translate('Locations.map.locations')}</TabsTrigger>
              <TabsTrigger value="stations">{translate('Locations.map.stations')}</TabsTrigger>
            </TabsList>
          </Tabs>
          {selectedId && selectedType && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      window.location.href =
                        selectedType === 'location'
                          ? `/locations/${selectedId}`
                          : `/charging-stations/${selectedId}`;
                    }}
                  >
                    {translate('Locations.map.viewDetails')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{translate('Locations.map.viewTypeDetails', { type: selectedType })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="map-wrapper">
        <LocationMap
          locations={locations}
          defaultCenter={defaultCenter}
          zoom={defaultZoom}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={selectedId || undefined}
        />
      </div>

      <div className="map-footer flex gap-4">
        <div className="legend-item flex items-center gap-2">
          <div
            className="legend-color w-4 h-4 rounded"
            style={{ backgroundColor: 'var(--primary-color-1)' }}
          ></div>
          <span>{translate('Locations.map.online')}</span>
        </div>
        <div className="legend-item flex items-center gap-2">
          <div
            className="legend-color w-4 h-4 rounded"
            style={{ backgroundColor: 'var(--grayscale-color-2)' }}
          ></div>
          <span>{translate('Locations.map.partial')}</span>
        </div>
        <div className="legend-item flex items-center gap-2">
          <div
            className="legend-color w-4 h-4 rounded"
            style={{ backgroundColor: 'var(--secondary-color-2)' }}
          ></div>
          <span>{translate('Locations.map.offline')}</span>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const determineLocationStatus = (location: LocationDto): 'online' | 'offline' | 'partial' => {
  if (!location.chargingPool || location.chargingPool.length === 0) {
    return 'offline';
  }

  const onlineCount = location.chargingPool.filter((station) => station.isOnline).length;

  if (onlineCount === location.chargingPool.length) {
    return 'online';
  } else if (onlineCount === 0) {
    return 'offline';
  } else {
    return 'partial';
  }
};

const determineLocationColor = (location: LocationDto): string => {
  const status = determineLocationStatus(location);

  switch (status) {
    case 'online':
      return 'var(--primary-color-1)';
    case 'partial':
      return 'var(--grayscale-color-2)';
    case 'offline':
    default:
      return 'var(--secondary-color-2)';
  }
};
