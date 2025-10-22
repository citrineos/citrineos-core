// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingStationSchema } from './charging.station.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const ServerNetworkProfileSchema = BaseSchema.extend({
  id: z.string(),
  host: z.string(),
  port: z.number().int(),
  pingInterval: z.number().int(),
  protocol: z.string(), // OCPPVersionType
  messageTimeout: z.number().int(),
  securityProfile: z.number().int(),
  allowUnknownChargingStations: z.boolean(),
  tlsKeyFilePath: z.string().optional(),
  tlsCertificateChainFilePath: z.string().optional(),
  mtlsCertificateAuthorityKeyFilePath: z.string().optional(),
  rootCACertificateFilePath: z.string().optional(),
  chargingStations: z.array(ChargingStationSchema).nullable().optional(),
});

export const ServerNetworkProfileProps = ServerNetworkProfileSchema.keyof().enum;

export type ServerNetworkProfileDto = z.infer<typeof ServerNetworkProfileSchema>;

export const ServerNetworkProfileCreateSchema = ServerNetworkProfileSchema.omit({
  tenant: true,
  chargingStations: true,
  updatedAt: true,
  createdAt: true,
});

export type ServerNetworkProfileCreate = z.infer<typeof ServerNetworkProfileCreateSchema>;

export const serverNetworkProfileSchemas = {
  ServerNetworkProfile: ServerNetworkProfileSchema,
  ServerNetworkProfileCreate: ServerNetworkProfileCreateSchema,
};
