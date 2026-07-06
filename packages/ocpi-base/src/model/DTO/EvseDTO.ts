// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { EvseStatus } from '../EvseStatus.js';
import { z } from 'zod';
import { EvseStatusScheduleSchema } from '../EvseStatusSchedule.js';
import { Capability } from '../Capability.js';
import { ConnectorDTOSchema } from './ConnectorDTO.js';
import { GeoLocationSchema } from '../GeoLocation.js';
import { DisplayTextSchema } from '../DisplayText.js';
import { ParkingRestriction } from '../ParkingRestriction.js';
import { OcpiResponseSchema } from '../OcpiResponse.js';

// TODO make dynamic
export const uidDelimiter = '::';
export const UID_FORMAT = (stationId: string, evseId: string | number): string =>
  `${stationId}${uidDelimiter}${evseId}`;

export const EXTRACT_STATION_ID = (evseUid: string) => {
  const split = evseUid.split(uidDelimiter);
  return split.length > 1 ? split[0] : '';
};

export const EXTRACT_EVSE_ID = (evseUid: string) => {
  const split = evseUid.split(uidDelimiter);
  return split.length > 1 ? split[split.length - 1] : '';
};

export const EvseDTOSchema = z.object({
  uid: z.string().max(36),
  evse_id: z.string().max(48).nullable().optional(),
  status: z.nativeEnum(EvseStatus),
  status_schedule: z.array(EvseStatusScheduleSchema).nullable().optional(),
  capabilities: z.array(z.nativeEnum(Capability)).nullable().optional(),
  connectors: z.array(ConnectorDTOSchema).min(1),
  floor_level: z.string().max(4).nullable().optional(),
  coordinates: GeoLocationSchema.nullable().optional(),
  physical_reference: z.string().max(16).nullable().optional(),
  directions: z.array(DisplayTextSchema).nullable().optional(),
  parking_restrictions: z.array(z.nativeEnum(ParkingRestriction)).nullable().optional(),
  images: z.null().optional(),
  last_updated: z.coerce.date(),
});

export const EvseResponseSchema = OcpiResponseSchema(EvseDTOSchema);
export const EvseResponseSchemaName = 'EvseResponseSchema';
export const EvseListResponseSchema = OcpiResponseSchema(EvseDTOSchema);

export type EvseDTO = z.infer<typeof EvseDTOSchema>;
export type EvseResponse = z.infer<typeof EvseResponseSchema>;
export type EvseListResponse = z.infer<typeof EvseListResponseSchema>;
