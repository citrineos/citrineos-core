// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { AuthorizationSchema } from './authorization.dto.js';
import { ChargingStationSchema } from './charging.station.dto.js';
import { ConnectorSchema } from './connector.dto.js';
import { EvseSchema } from './evse.dto.js';
import { LocationSchema } from './location.dto.js';
import { MeterValueSchema } from './meter.value.dto.js';
import { StartTransactionSchema } from './start.transaction.dto.js';
import { StopTransactionSchema } from './stop.transaction.dto.js';
import { TariffSchema } from './tariff.dto.js';
import { TransactionEventSchema } from './transaction.event.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const TransactionSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  transactionId: z.string(),
  stationId: z.string(),
  isActive: z.boolean(),
  locationId: z.number().int().optional(),
  location: LocationSchema.optional(),
  station: ChargingStationSchema.optional(),
  evseId: z.number().int().optional(),
  evse: EvseSchema.nullable().optional(),
  connectorId: z.number().int().optional(),
  connector: ConnectorSchema.nullable().optional(),
  authorizationId: z.number().int().optional(),
  authorization: AuthorizationSchema.optional(),
  tariffId: z.number().int().optional(),
  tariff: TariffSchema.optional(),
  transactionEvents: z.array(TransactionEventSchema).optional(),
  meterValues: z.array(MeterValueSchema).optional(),
  startTransaction: StartTransactionSchema.optional(),
  stopTransaction: StopTransactionSchema.optional(),
  chargingState: z.string().nullable().optional(),
  timeSpentCharging: z.number().int().nullable().optional(), // BIGINT
  totalKwh: z.number().nullable().optional(), // DECIMAL
  stoppedReason: z.string().nullable().optional(),
  remoteStartId: z.number().int().nullable().optional(),
  totalCost: z.number().optional(), // DECIMAL
  startTime: z.iso.datetime().optional(),
  endTime: z.iso.datetime().optional(),
  customData: z.any().nullable().optional(),
});

export const TransactionProps = TransactionSchema.keyof().enum;

export type TransactionDto = z.infer<typeof TransactionSchema>;

export const TransactionCreateSchema = TransactionSchema.omit({
  id: true,
  tenant: true,
  location: true,
  station: true,
  evse: true,
  connector: true,
  authorization: true,
  tariff: true,
  transactionEvents: true,
  meterValues: true,
  startTransaction: true,
  stopTransaction: true,
  updatedAt: true,
  createdAt: true,
});

export type TransactionCreate = z.infer<typeof TransactionCreateSchema>;

export const transactionSchemas = {
  Transaction: TransactionSchema,
  TransactionCreate: TransactionCreateSchema,
};
