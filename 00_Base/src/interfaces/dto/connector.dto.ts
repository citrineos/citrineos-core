// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TariffSchema } from './tariff.dto.js';
import { BaseSchema } from './types/base.dto.js';
import {
  ConnectorErrorCodeEnumSchema,
  ConnectorFormatEnumSchema,
  ConnectorPowerTypeEnumSchema,
  ConnectorStatusEnumSchema,
  ConnectorTypeEnumSchema,
} from './types/enums.js';

export const ConnectorSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  evseId: z.number().int(),
  connectorId: z.number().int(),
  evseTypeConnectorId: z.number().int().optional(),
  status: ConnectorStatusEnumSchema.default('Unknown').nullable().optional(),
  type: ConnectorTypeEnumSchema.nullable().optional(),
  format: ConnectorFormatEnumSchema.nullable().optional(),
  errorCode: ConnectorErrorCodeEnumSchema.default('NoError').nullable().optional(),
  powerType: ConnectorPowerTypeEnumSchema.nullable().optional(),
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

export const ConnectorProps = ConnectorSchema.keyof().enum;

export type ConnectorDto = z.infer<typeof ConnectorSchema>;

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
