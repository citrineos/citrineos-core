// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import { type ActionResult, authedAction } from '@lib/utils/action-guard';
import config from '@lib/utils/config';

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Autocomplete for street addresses globally, with optional country filtering.
 * Uses Places API (New) Autocomplete.
 */
export async function autocompleteAddress(
  input: string,
  country?: string,
  sessionToken?: string,
): Promise<ActionResult<PlacePrediction[]>> {
  return authedAction<PlacePrediction[]>(async (_session) => {
    if (!input) throw new Error('Missing input for autocomplete');

    const body: Record<string, unknown> = {
      input,
      includedPrimaryTypes: ['street_address', 'premise', 'subpremise', 'route'],
    };

    if (country) {
      body.includedRegionCodes = [country.toUpperCase()];
    }

    if (sessionToken) {
      body.sessionToken = sessionToken;
    }

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.googleMapsAddressApiKey!,
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch autocomplete suggestions due to error:', errorText);
      throw new Error('Failed to fetch autocomplete suggestions');
    }

    const data = await response.json();

    return (data.suggestions || [])
      .filter((s: any) => s.placePrediction)
      .map((s: any) => ({
        place_id: s.placePrediction.placeId,
        description: s.placePrediction.text.text,
        structured_formatting: s.placePrediction.structuredFormat
          ? {
              main_text: s.placePrediction.structuredFormat.mainText.text,
              secondary_text: s.placePrediction.structuredFormat.secondaryText?.text || '',
            }
          : undefined,
      }));
  });
}
