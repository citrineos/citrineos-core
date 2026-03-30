// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ConnectorSchemaWithoutParent } from './connector.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { DisplayTextSchema } from './types/display.dto.js';
import { ImageSchema } from './types/ocpi.registration.js';
import { PointSchema } from './types/location.js';
import {
  ChargingStationCapabilitySchema,
  ChargingStationParkingRestrictionSchema,
} from './types/enums.js';
import { OcpiEvseStatusEnum } from './types/ocpi.evse.status.dto.js';

const EvseStatusScheduleSchema = z.object({
  period_begin: z.coerce.date(),
  period_end: z.coerce.date().nullable().optional(),
  status: z.string(),
});

export const EvseSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  evseTypeId: z.number().int().optional(),
  evseId: z.string(), // eMI3 compliant EVSE ID
  physicalReference: z.string().nullable().optional(),
  removed: z.boolean().optional(),
  images: z.array(ImageSchema).nullable().optional(),
  directions: z.array(DisplayTextSchema).nullable().optional(),
  connectors: z.array(ConnectorSchemaWithoutParent).nullable().optional(),
  capabilities: z.array(ChargingStationCapabilitySchema).nullable().optional(),
  floorLevel: z.string().nullable().optional(),
  coordinates: PointSchema.nullable().optional(),
  parkingRestrictions: z.array(ChargingStationParkingRestrictionSchema).nullable().optional(),
  statusSchedule: z.array(EvseStatusScheduleSchema).nullable().optional(),
  ocpiUid: z.string().nullable().optional(),
  ocpiStatus: z.nativeEnum(OcpiEvseStatusEnum).nullable().optional(),
});

export const EvseProps = EvseSchema.keyof().enum;

export type EvseDto = z.infer<typeof EvseSchema>;

export const EvseCreateSchema = EvseSchema.omit({
  id: true,
  tenant: true,
  chargingStation: true,
  connectors: true,
  updatedAt: true,
  createdAt: true,
});

export type EvseCreate = z.infer<typeof EvseCreateSchema>;

export const evseSchemas = {
  Evse: EvseSchema,
  EvseCreate: EvseCreateSchema,
};
