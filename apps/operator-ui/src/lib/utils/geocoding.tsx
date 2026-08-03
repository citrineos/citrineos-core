// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LocationDto } from '@citrineos/types';
import config from '@lib/utils/config';

export interface GoogleGeocodingResponse {
  results: GeocodingResult[];
  status: string;
}

export interface GeocodingResult {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: Geometry;
  place_id: string;
  plus_code?: PlusCode;
  types: string[];
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface Geometry {
  location: LatLng;
  location_type: string;
  viewport: Viewport;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Viewport {
  northeast: LatLng;
  southwest: LatLng;
}

export interface PlusCode {
  compound_code: string;
  global_code: string;
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  const encodedAddress = encodeURIComponent(address);
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${config.googleMapsApiKey}`;

  try {
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0];
    } else {
      console.error('No coordinates found for this address.', data);
      return Promise.reject('No coordinates found for this address.');
    }
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return Promise.reject('No coordinates found for this address. Error: ' + error.message);
  }
};

export const getAddressComponent = (components: AddressComponent[], type: string): string => {
  const found = components.find((comp) => comp.types.includes(type));
  return found ? found.long_name : '';
};

export const getFullAddress = (location: Partial<LocationDto>) => {
  return `${location.address || ''}, ${location.city || ''}, ${
    location.state || ''
  } ${location.postalCode || ''}, ${location.country || ''}`.trim();
};
