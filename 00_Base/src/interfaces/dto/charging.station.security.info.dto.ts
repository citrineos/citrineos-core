// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const ChargingStationSecurityInfoSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  publicKeyFileId: z.string(),
});

export const ChargingStationSecurityInfoProps = ChargingStationSecurityInfoSchema.keyof().enum;

export type ChargingStationSecurityInfoDto = z.infer<typeof ChargingStationSecurityInfoSchema>;

export const ChargingStationSecurityInfoCreateSchema = ChargingStationSecurityInfoSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type ChargingStationSecurityInfoCreate = z.infer<
  typeof ChargingStationSecurityInfoCreateSchema
>;

export const chargingStationSecurityInfoSchemas = {
  ChargingStationSecurityInfo: ChargingStationSecurityInfoSchema,
  ChargingStationSecurityInfoCreate: ChargingStationSecurityInfoCreateSchema,
};
