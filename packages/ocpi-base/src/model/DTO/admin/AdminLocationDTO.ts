// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { GeoLocationSchema } from '../../GeoLocation.js';

export const AdminConnectorDTOSchema = z.object({
  id: z.number(),
});
export type AdminConnectorDTO = z.infer<typeof AdminConnectorDTOSchema>;

export const AdminEvseDTOSchema = z.object({
  station_id: z.string(),
  id: z.number(),
  physical_reference: z.string().optional(),
  removed: z.boolean().optional(),
  connectors: z.array(AdminConnectorDTOSchema).optional(),
});
export type AdminEvseDTO = z.infer<typeof AdminEvseDTOSchema>;

export const AdminLocationDTOSchema = z.object({
  id: z.number().optional(), // optional for both CREATE/UPDATE
  country_code: z.string().max(2).optional(), // required on CREATE, optional on UPDATE
  party_id: z.string().max(3).optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  coordinates: GeoLocationSchema.optional(), // required on CREATE, optional on UPDATE
  time_zone: z.string().optional(),
  publish: z.boolean().optional(),
  evses: z.array(AdminEvseDTOSchema).optional(),
});
export type AdminLocationDTO = z.infer<typeof AdminLocationDTOSchema>;
