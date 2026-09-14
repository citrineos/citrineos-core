// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useCallback } from 'react';
import type { LocationDto } from '@citrineos/types';
import type { Marker } from '@googlemaps/markerclusterer';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { MarkerIconCircle } from '@lib/client/components/map/marker-icons';

export const MapMarkerV2 = ({
  location,
  onClickAction,
  setMarkerRefAction,
}: {
  location: LocationDto;
  onClickAction: (location: LocationDto) => void;
  setMarkerRefAction: (marker: Marker | null, id: number) => void;
}) => {
  const handleClick = useCallback(() => onClickAction(location), [onClickAction, location]);
  const ref = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement) =>
      setMarkerRefAction(marker, location.id ?? 0),
    [setMarkerRefAction, location.id],
  );

  return (
    <AdvancedMarker
      position={{
        lat: location.coordinates.coordinates[1]!,
        lng: location.coordinates.coordinates[0]!,
      }}
      ref={ref}
      onClick={handleClick}
    >
      <MarkerIconCircle
        fillColor="var(--primary)"
        style={{
          width: '40px',
          height: '40px',
        }}
      />
    </AdvancedMarker>
  );
};
