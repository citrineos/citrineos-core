// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingStationSchema } from './charging.station.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { LocationFacilityEnumSchema, LocationParkingEnumSchema } from './types/enums.js';
import { LocationHoursSchema, PointSchema } from './types/location.js';
export {
  ImageSchema,
  type Image,
  BusinessDetailsSchema,
  type BusinessDetails,
} from './types/ocpi.registration.js';
import { ImageSchema, BusinessDetailsSchema } from './types/ocpi.registration.js';

import { DisplayTextSchema } from './types/display.dto.js';
export { DisplayTextSchema, type DisplayText } from './types/display.dto.js';

export enum TokenType {
  AD_HOC_USER = 'AD_HOC_USER',
  APP_USER = 'APP_USER',
  OTHER = 'OTHER',
  RFID = 'RFID',
}

export const PublishTokenTypeSchema = z.object({
  uid: z.string().max(36).nullable().optional(),
  type: z.nativeEnum(TokenType).nullable().optional(),
  visual_number: z.string().max(64).nullable().optional(),
  issuer: z.string().max(64).nullable().optional(),
  group_id: z.string().max(36).nullable().optional(),
});

export type PublishTokenType = z.infer<typeof PublishTokenTypeSchema>;

export enum EnergySourceCategory {
  NUCLEAR = 'NUCLEAR',
  GENERAL_FOSSIL = 'GENERAL_FOSSIL',
  COAL = 'COAL',
  GAS = 'GAS',
  GENERAL_GREEN = 'GENERAL_GREEN',
  SOLAR = 'SOLAR',
  WIND = 'WIND',
  WATER = 'WATER',
}

export const EnergySourcesSchema = z.object({
  source: z.nativeEnum(EnergySourceCategory),
  percentage: z.number().min(0).max(100),
});

export enum EnvironmentalImpactCategory {
  NUCLEAR_WASTE = 'NUCLEAR_WASTE',
  CARBON_DIOXIDE = 'CARBON_DIOXIDE',
}

export const EnvironmentalImpactSchema = z.object({
  category: z.nativeEnum(EnvironmentalImpactCategory),
  amount: z.number().min(0),
});

export const EnergyMixSchema = z.object({
  is_green_energy: z.boolean(),
  energy_sources: z.array(EnergySourcesSchema).nullable().optional(),
  environ_impact: z.array(EnvironmentalImpactSchema).nullable().optional(),
  supplier_name: z.string().max(64).nullable().optional(),
  energy_product_name: z.string().max(64).nullable().optional(),
});

export type EnergyMix = z.infer<typeof EnergyMixSchema>;

export const AdditionalGeoLocationSchema = z.object({
  latitude: z.string().regex(/^-?[0-9]{1,2}\.[0-9]{5,7}$/),
  longitude: z.string().regex(/^-?[0-9]{1,3}\.[0-9]{5,7}$/),
  name: DisplayTextSchema.nullable().optional(),
});

export type AdditionalGeoLocation = z.infer<typeof AdditionalGeoLocationSchema>;

export const LocationSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  state: z.string(),
  country: z.string(),
  publishUpstream: z.boolean().default(true),
  publishAllowedTo: z.array(PublishTokenTypeSchema).nullable().optional(),
  timeZone: z.string().default('UTC'),
  parkingType: LocationParkingEnumSchema.nullable().optional(),
  facilities: z.array(LocationFacilityEnumSchema).nullable().optional(),
  openingHours: LocationHoursSchema.nullable().optional(),
  chargingWhenClosed: z.boolean().nullable().optional(),
  coordinates: PointSchema,
  directions: z.array(DisplayTextSchema).nullable().optional(),
  operator: BusinessDetailsSchema.nullable().optional(),
  suboperator: BusinessDetailsSchema.nullable().optional(),
  owner: BusinessDetailsSchema.nullable().optional(),
  energyMix: EnergyMixSchema.nullable().optional(),
  images: z.array(ImageSchema).nullable().optional(),
  chargingPool: z.array(ChargingStationSchema).nullable().optional(),
  ownerTenantPartnerId: z.number().int().nullable().optional(),
  relatedLocations: z.array(AdditionalGeoLocationSchema).nullable().optional(),
  ocpiId: z.string().max(36).nullable().optional(),
  roamingPartnerId: z.number().int().nullable().optional(),
  disableOCPI: z.boolean().default(false).nullable().optional(),
});

export const LocationProps = LocationSchema.keyof().enum;

export type LocationDto = z.infer<typeof LocationSchema>;

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
