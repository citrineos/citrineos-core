// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { ChargingStationIcon, LocationIcon } from '@lib/client/components/map/marker-icons';
import type { BaseMapMarkerProps } from '@lib/client/components/map/types';

export const MapMarkerComponent: React.FC<
  BaseMapMarkerProps & { type: 'station' | 'location' | 'mixed' }
> = ({
  position,
  identifier,
  reactContent,
  onClick,
  isSelected,
  color = 'var(--secondary-color-2)',
  type,
  status,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  // Create the appropriate icon based on type
  const renderIcon = () => {
    if (type === 'station') {
      return <ChargingStationIcon color={color} status={status} />;
    } else {
      return <LocationIcon color={color} />;
    }
  };

  // Optional custom content can be provided
  const content = reactContent || renderIcon();

  // Handle click event
  const handleClick = () => {
    if (onClick) {
      onClick(identifier, type);
    }
  };

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      onClick={handleClick}
      className={isSelected ? 'selected-marker' : ''}
    >
      {content}
    </AdvancedMarker>
  );
};
