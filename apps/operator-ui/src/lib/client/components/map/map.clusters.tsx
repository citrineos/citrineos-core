// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { LocationDto } from '@citrineos/base';
import { InfoWindow, useMap } from '@vis.gl/react-google-maps';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type Marker, MarkerClusterer } from '@googlemaps/markerclusterer';
import { MapMarkerV2 } from '@lib/client/components/map/map.clusters.marker';
import { ChargingStationStatusTag } from '@lib/client/pages/charging-stations/charging.station.status.tag';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { useTranslate } from '@refinedev/core';

/**
 * Reference: https://github.com/visgl/react-google-maps/blob/main/examples/marker-clustering/src/clustered-tree-markers.tsx
 */
export const ClusteredLocationMarkers = ({ locations }: { locations: LocationDto[] }) => {
  const [markers, setMarkers] = useState<{ [id: number]: Marker }>({});
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const translate = useTranslate();

  const selectedLocation = useMemo(
    () =>
      locations && selectedLocationId ? locations.find((t) => t.id === selectedLocationId)! : null,
    [locations, selectedLocationId],
  );

  const map = useMap();
  const clusterer = useMemo(() => {
    if (!map) return null;

    return new MarkerClusterer({ map });
  }, [map]);

  useEffect(() => {
    if (!clusterer) return;

    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  const setMarkerRef = useCallback((marker: Marker | null, id: number) => {
    setMarkers((markers) => {
      if ((marker && markers[id]) || (!marker && !markers[id])) return markers;

      if (marker) {
        return { ...markers, [id]: marker };
      } else {
        const { [id]: _, ...newMarkers } = markers;

        return newMarkers;
      }
    });
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedLocationId(null);
  }, []);

  const handleMarkerClick = useCallback((location: LocationDto) => {
    setSelectedLocationId(location.id!);
  }, []);

  return (
    <>
      {locations.map((location) => (
        <MapMarkerV2
          key={location.id}
          location={location}
          onClickAction={handleMarkerClick}
          setMarkerRefAction={setMarkerRef}
        />
      ))}

      {selectedLocationId && (
        <InfoWindow
          headerContent={
            <span
              className={`cursor-pointer font-semibold underline text-black hover:text-gray-500 text-lg`}
              onClick={() =>
                window.open(`/${MenuSection.LOCATIONS}/${selectedLocationId}`, '_blank')
              }
            >
              {selectedLocation?.name}
            </span>
          }
          className="min-w-30 max-h-50"
          anchor={markers[selectedLocationId]}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="flex flex-col gap-2">
            {selectedLocation?.chargingPool && selectedLocation?.chargingPool.length > 0 ? (
              selectedLocation?.chargingPool.map((charger) => (
                <div key={charger.id} className="border rounded-sm p-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`cursor-pointer font-semibold underline text-base text-black hover:text-gray-500`}
                      onClick={() =>
                        window.open(`/${MenuSection.CHARGING_STATIONS}/${charger.id}`, '_blank')
                      }
                    >
                      {charger.ocppConnectionName}
                    </span>
                    <span
                      className={`${charger.isOnline ? 'text-success' : 'text-destructive'} text-xs`}
                    >
                      {charger.isOnline ? translate('Common.online') : translate('Common.offline')}
                    </span>
                  </div>
                  {charger.evses && charger.evses.length > 0 && (
                    <ChargingStationStatusTag station={charger} />
                  )}
                </div>
              ))
            ) : (
              <div className="text-black">{translate('Locations.map.noChargers')}</div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};
