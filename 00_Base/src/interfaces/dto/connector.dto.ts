// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TariffSchema } from './tariff.dto.js';
import { BaseSchema } from './types/base.dto.js';
import {
  ConnectorErrorCodeSchema,
  ConnectorFormatSchema,
  ConnectorPowerTypeSchema,
  ConnectorStatusSchema,
  ConnectorTypeSchema,
} from './types/enums.js';

export const ConnectorSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  evseId: z.number().int(),
  connectorId: z.number().int(),
  evseTypeConnectorId: z.number().int().optional(),
  status: ConnectorStatusSchema.default('Unknown').nullable().optional(),
  type: ConnectorTypeSchema.nullable().optional(),
  format: ConnectorFormatSchema.nullable().optional(),
  errorCode: ConnectorErrorCodeSchema.default('NoError').nullable().optional(),
  powerType: ConnectorPowerTypeSchema.nullable().optional(),
  maximumAmperage: z.number().int().nullable().optional(),
  maximumVoltage: z.number().int().nullable().optional(),
  maximumPowerWatts: z.number().int().nullable().optional(),
  timestamp: z.iso.datetime(),
  info: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  vendorErrorCode: z.string().nullable().optional(),
  termsAndConditionsUrl: z.string().nullable().optional(),
  tariffs: z.array(TariffSchema).nullable().optional(),
});

export type ConnectorDto = z.infer<typeof ConnectorSchema>;
export type ConnectorStatus = z.infer<typeof ConnectorStatusSchema>;
export type ConnectorType = z.infer<typeof ConnectorTypeSchema>;
export type ConnectorFormat = z.infer<typeof ConnectorFormatSchema>;
export type ConnectorErrorCode = z.infer<typeof ConnectorErrorCodeSchema>;
export type ConnectorPowerType = z.infer<typeof ConnectorPowerTypeSchema>;

export const ConnectorCreateSchema = ConnectorSchema.omit({
  id: true,
  tenant: true,
  evse: true,
  chargingStation: true,
  tariffs: true,
  updatedAt: true,
  createdAt: true,
});

export type ConnectorCreate = z.infer<typeof ConnectorCreateSchema>;

export const connectorSchemas = {
  Connector: ConnectorSchema,
  ConnectorCreate: ConnectorCreateSchema,
};
