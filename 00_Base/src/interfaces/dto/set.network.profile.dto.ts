// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ServerNetworkProfileSchema } from './server.network.profile.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const SetNetworkProfileSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  correlationId: z.string(),
  websocketServerConfigId: z.string().optional(),
  websocketServerConfig: ServerNetworkProfileSchema.optional(),
  configurationSlot: z.number().int(),
  ocppVersion: z.string(),
  ocppTransport: z.string(),
  ocppCsmsUrl: z.string(),
  messageTimeout: z.number().int(),
  securityProfile: z.number().int(),
  ocppInterface: z.string(),
  apn: z.string().optional(), // Stringified JSON
  vpn: z.string().optional(), // Stringified JSON
});

export const SetNetworkProfileProps = SetNetworkProfileSchema.keyof().enum;

export type SetNetworkProfileDto = z.infer<typeof SetNetworkProfileSchema>;

export const SetNetworkProfileCreateSchema = SetNetworkProfileSchema.omit({
  id: true,
  tenant: true,
  websocketServerConfig: true,
  updatedAt: true,
  createdAt: true,
});

export type SetNetworkProfileCreate = z.infer<typeof SetNetworkProfileCreateSchema>;

export const setNetworkProfileSchemas = {
  SetNetworkProfile: SetNetworkProfileSchema,
  SetNetworkProfileCreate: SetNetworkProfileCreateSchema,
};
