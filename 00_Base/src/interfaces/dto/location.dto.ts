// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingStationSchema } from './charging.station.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { LocationFacilityEnumSchema, LocationParkingEnumSchema } from './types/enums.js';
import { LocationHoursSchema, PointSchema } from './types/location.js';

export const LocationSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  state: z.string(),
  country: z.string(),
  publishUpstream: z.boolean().default(true),
  timeZone: z.string().default('UTC'),
  parkingType: LocationParkingEnumSchema.nullable().optional(),
  facilities: z.array(LocationFacilityEnumSchema).nullable().optional(),
  openingHours: LocationHoursSchema.nullable().optional(),
  coordinates: PointSchema,
  chargingPool: z.array(ChargingStationSchema).nullable().optional(),
});

export const LocationProps = LocationSchema.keyof().enum;

export type LocationDto = z.infer<typeof LocationSchema>;
export type Point = z.infer<typeof PointSchema>;

export const LocationCreateSchema = LocationSchema.omit({
  id: true,
  tenant: true,
  chargingPool: true,
  updatedAt: true,
  createdAt: true,
});

export type LocationCreate = z.infer<typeof LocationCreateSchema>;

export const locationSchemas = {
  Location: LocationSchema,
  LocationCreate: LocationCreateSchema,
};
