// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ConnectorSchema } from './connector.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const EvseSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  evseTypeId: z.number().int().optional(),
  evseId: z.string(), // eMI3 compliant EVSE ID
  physicalReference: z.string().nullable().optional(),
  removed: z.boolean().optional(),
  connectors: z.array(ConnectorSchema).nullable().optional(),
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
