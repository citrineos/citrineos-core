// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../ui/input';
import debounce from 'lodash.debounce';
import { autocompleteAddress } from '@lib/server/actions/map/autocompleteAddress';
import { getPlaceDetails } from '@lib/server/actions/map/getPlaceDetails';
import { useTranslate } from '@refinedev/core';

type Prediction = {
  description: string;
  place_id: string;
};

export type PlaceDetails = {
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
  coordinates: { lat: number; lng: number };
};

type Props = {
  value: string;
  onChangeAction: (value: string) => void;
  onSelectPlaceAction: (placeId: string, placeDetails: PlaceDetails) => void;
  countryCode?: string;
  placeholder?: string;
  sessionToken?: string;
};

export const AddressAutocomplete: React.FC<Props> = ({
  value,
  onChangeAction,
  onSelectPlaceAction,
  countryCode,
  placeholder,
  sessionToken,
}) => {
  const translate = useTranslate();
  const resolvedPlaceholder = placeholder ?? translate('Common.startTypingAddress');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPredictions = debounce((input: string) => {
    if (!input) {
      setPredictions([]);
      return;
    }
    setLoading(true);

    autocompleteAddress(input, countryCode?.toUpperCase(), sessionToken)
      .then((result) => {
        if (result.success) {
          return setPredictions(result.data);
        }
      })
      .catch((err) => {
        console.log(err);
        setPredictions([]);
      })
      .finally(() => setLoading(false));
  }, 300);

  useEffect(() => {
    fetchPredictions(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (prediction: Prediction) => {
    setShowDropdown(false);
    onChangeAction(prediction.description);

    getPlaceDetails(prediction.place_id, sessionToken)
      .then((result) => {
        if (!result.success) {
          throw new Error(result.error);
        }
        const details = result.data;

        const location = details.location;
        const components = details.addressComponents;

        const getComponent = (type: string) =>
          components?.find((c) => c.types.includes(type))?.longText;

        const getComponentShort = (type: string) =>
          components?.find((c) => c.types.includes(type))?.shortText;

        const streetNumber = getComponent('street_number') || '';
        const route = getComponent('route') || '';
        const streetAddress = `${streetNumber} ${route}`.trim();

        const adminArea =
          getComponent('administrative_area_level_1') ||
          getComponent('administrative_area_level_2') ||
          '';

        const fullDetails: PlaceDetails = {
          address: streetAddress || details.formattedAddress,
          city:
            getComponent('locality') ||
            getComponent('sublocality') ||
            getComponent('administrative_area_level_2') ||
            '',
          state: adminArea,
          postalCode: getComponent('postal_code') || '',
          countryCode: getComponentShort('country') || '',
          countryName: getComponent('country') || '',
          coordinates: {
            lat: location.latitude,
            lng: location.longitude,
          },
        };

        onChangeAction(fullDetails.address);
        onSelectPlaceAction(prediction.place_id, fullDetails);
      })
      .catch((err) => {
        console.error('Failed to fetch place details', err);
      });
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        value={value}
        onChange={(e) => {
          onChangeAction(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (predictions.length > 0) {
            setShowDropdown(true);
          }
        }}
        placeholder={resolvedPlaceholder}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-bwignore="true"
      />
      {showDropdown && (predictions.length > 0 || loading) && (
        <ul className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md max-h-60 overflow-auto">
          {loading && predictions.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {translate('Common.loadingEllipsis')}
            </li>
          )}
          {predictions.map((p) => (
            <li
              key={p.place_id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(p);
              }}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
