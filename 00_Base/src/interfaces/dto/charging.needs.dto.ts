// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import {
  ACChargingParametersSchema,
  DCChargingParametersSchema,
} from './types/charging.parameters.js';
import { EnergyTransferModeEnumSchema } from './types/enums.js';

export const ChargingNeedsSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  acChargingParameters: ACChargingParametersSchema.nullable().optional(),
  dcChargingParameters: DCChargingParametersSchema.nullable().optional(),
  departureTime: z.iso.datetime().nullable().optional(),
  requestedEnergyTransfer: EnergyTransferModeEnumSchema,
  maxScheduleTuples: z.number().int().nullable().optional(),
  evseId: z.number().int(),
  transactionDatabaseId: z.number().int(),
});

export const ChargingNeedsProps = ChargingNeedsSchema.keyof().enum;

export type ChargingNeedsDto = z.infer<typeof ChargingNeedsSchema>;

export const ChargingNeedsCreateSchema = ChargingNeedsSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type ChargingNeedsCreate = z.infer<typeof ChargingNeedsCreateSchema>;

export const chargingNeedsSchemas = {
  ChargingNeeds: ChargingNeedsSchema,
  ChargingNeedsCreate: ChargingNeedsCreateSchema,
};
