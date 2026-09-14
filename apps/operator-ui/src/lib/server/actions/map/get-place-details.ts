// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import config from '@lib/utils/config';
import { authedAction, type ActionResult } from '@lib/utils/action-guard';

export interface PlaceDetailsResponse {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  addressComponents: Array<{
    longText: string;
    shortText: string;
    types: string[];
    languageCode?: string;
  }>;
  location: {
    latitude: number;
    longitude: number;
  };
  plusCode?: {
    globalCode: string;
    compoundCode?: string;
  };
  types?: string[];
}

// Google Place IDs are always alphanumeric with limited punctuation.
// Reject anything that doesn't match before it touches the URL.
const PLACE_ID_REGEX = /^[A-Za-z0-9_-]{10,250}$/;

// Session tokens are UUIDs
const SESSION_TOKEN_REGEX = /^[0-9a-f-]{36}$/i;

export async function getPlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<ActionResult<PlaceDetailsResponse>> {
  return authedAction(async (_session) => {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    if (!PLACE_ID_REGEX.test(placeId)) {
      throw new Error('Invalid place ID');
    }

    if (sessionToken !== undefined && !SESSION_TOKEN_REGEX.test(sessionToken)) {
      throw new Error('Invalid session token');
    }

    const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
    if (sessionToken) {
      url.searchParams.set('sessionToken', sessionToken);
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': config.googleMapsAddressApiKey!,
          'X-Goog-FieldMask':
            'id,displayName,formattedAddress,addressComponents,location,plusCode,types',
        },
      });
    } catch (err) {
      console.error('Network error fetching place details:', err);
      throw new Error('Failed to fetch place details');
    }

    if (!response.ok) {
      console.error('Google Places API error:', response.status, await response.text());
      throw new Error('Failed to fetch place details');
    }

    const data = await response.json();
    return data as PlaceDetailsResponse;
  });
}
