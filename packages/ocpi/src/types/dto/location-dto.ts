// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

import { GeoLocationSchema } from '../geo-location.js';
import { AdditionalGeoLocationSchema } from '../additional-geo-location.js';
import { ParkingType } from '../parking-type.js';
import { EvseDTOSchema } from './evse-dto.js';
import { PublishTokenTypeSchema } from '../publish-token-type.js';
import { BusinessDetailsSchema } from '../business-details.js';
import { Facilities } from '../facilities.js';
import { HoursSchema } from '../hours.js';
import { EnergyMixSchema } from '../energy-mix.js';
import { OcpiResponseSchema } from '../ocpi-response.js';
import { PaginatedResponseSchema } from '../paginated-response.js';

export const LocationDTOSchema = z.object({
  country_code: z.string().min(2).max(2),
  party_id: z.string().max(3),
  id: z.string().max(36),
  publish: z.boolean(),
  publish_allowed_to: z.array(PublishTokenTypeSchema).nullable().optional(),
  name: z.string().max(255).nullable().optional(),
  address: z.string().max(45),
  city: z.string().max(45),
  postal_code: z.string().max(10).nullable().optional(),
  state: z.string().max(20).nullable().optional(),
  country: z.string().min(3).max(3),
  coordinates: GeoLocationSchema,
  related_locations: z.array(AdditionalGeoLocationSchema).nullable().optional(),
  parking_type: z.nativeEnum(ParkingType).nullable().optional(),
  evses: z.array(EvseDTOSchema).nullable().optional(),
  directions: z.null().optional(),
  operator: BusinessDetailsSchema.nullable().optional(),
  suboperator: BusinessDetailsSchema.nullable().optional(),
  owner: BusinessDetailsSchema.nullable().optional(),
  facilities: z.array(z.nativeEnum(Facilities)).nullable().optional(),
  time_zone: z.string().max(255),
  opening_times: HoursSchema.nullable().optional(),
  charging_when_closed: z.null().optional(),
  images: z.null().optional(),
  energy_mix: EnergyMixSchema.nullable().optional(),
  last_updated: z.coerce.date(),
});

export const LocationResponseSchema = OcpiResponseSchema(LocationDTOSchema);
export const LocationResponseSchemaName = 'LocationResponseSchema';

export const PaginatedLocationResponseSchema = PaginatedResponseSchema(LocationDTOSchema);
export const PaginatedLocationResponseSchemaName = 'PaginatedLocationResponseSchema';

export type LocationDTO = z.infer<typeof LocationDTOSchema>;
export type LocationResponse = z.infer<typeof LocationResponseSchema>;
export type PaginatedLocationResponse = z.infer<typeof PaginatedLocationResponseSchema>;
