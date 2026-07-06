// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LocationDto } from '@citrineos/base';
import { Button } from '@lib/client/components/ui/button';
import { ResourceType } from '@lib/utils/access.types';
import { useNavigation, useTranslate } from '@refinedev/core';
import React from 'react';

interface LocationMarkerProps {
  location: LocationDto;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({ location }) => {
  const { show } = useNavigation();
  const translate = useTranslate();

  const handleShowClick = () => {
    show(ResourceType.LOCATIONS, location.id!);
  };

  return (
    <div className="location-marker-content">
      <h4 className="location-name">{location.name}</h4>
      <p className="location-address">{location.address}</p>
      <p className="location-details">
        {location.city}, {location.state} {location.postalCode}, {location.country}
      </p>
      <Button onClick={handleShowClick} className="mt-2">
        {translate('Locations.map.viewDetails')}
      </Button>
    </div>
  );
};
