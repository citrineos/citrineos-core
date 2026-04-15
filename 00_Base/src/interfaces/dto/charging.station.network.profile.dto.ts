// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ServerNetworkProfileSchema } from './server.network.profile.dto.js';
import { SetNetworkProfileSchema } from './set.network.profile.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const ChargingStationNetworkProfileSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  configurationSlot: z.number().int(),
  setNetworkProfileId: z.number().int(),
  setNetworkProfile: SetNetworkProfileSchema,
  websocketServerConfigId: z.string().optional(),
  websocketServerConfig: ServerNetworkProfileSchema.optional(),
});

export const ChargingStationNetworkProfileProps = ChargingStationNetworkProfileSchema.keyof().enum;

export type ChargingStationNetworkProfileDto = z.infer<typeof ChargingStationNetworkProfileSchema>;

export const ChargingStationNetworkProfileCreateSchema = ChargingStationNetworkProfileSchema.omit({
  id: true,
  tenant: true,
  setNetworkProfile: true,
  websocketServerConfig: true,
  updatedAt: true,
  createdAt: true,
});

export type ChargingStationNetworkProfileCreate = z.infer<
  typeof ChargingStationNetworkProfileCreateSchema
>;

export const chargingStationNetworkProfileSchemas = {
  ChargingStationNetworkProfile: ChargingStationNetworkProfileSchema,
  ChargingStationNetworkProfileCreate: ChargingStationNetworkProfileCreateSchema,
};
