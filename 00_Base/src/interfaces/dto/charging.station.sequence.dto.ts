// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingStationSchema } from './charging.station.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { ChargingStationSequenceTypeSchema } from './types/enums.js';

export const ChargingStationSequenceSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string().max(36),
  type: ChargingStationSequenceTypeSchema,
  value: z.number().int().default(0), // BIGINT
  station: ChargingStationSchema.optional(),
});

export const ChargingStationSequenceProps = ChargingStationSequenceSchema.keyof().enum;

export type ChargingStationSequenceDto = z.infer<typeof ChargingStationSequenceSchema>;

export const ChargingStationSequenceCreateSchema = ChargingStationSequenceSchema.omit({
  id: true,
  tenant: true,
  station: true,
  updatedAt: true,
  createdAt: true,
});

export type ChargingStationSequenceCreate = z.infer<typeof ChargingStationSequenceCreateSchema>;

export const chargingStationSequenceSchemas = {
  ChargingStationSequence: ChargingStationSequenceSchema,
  ChargingStationSequenceCreate: ChargingStationSequenceCreateSchema,
};
