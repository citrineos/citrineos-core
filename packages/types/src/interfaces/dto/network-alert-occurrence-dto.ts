// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base-dto.js';
import { ConnectorErrorCodeEnumSchema, ConnectorStatusEnumSchema } from './types/enums.js';
import {
  NetworkAlertSeveritySchema,
  NetworkAlertTypeSchema,
  OcppCallFailureReasonSchema,
} from './types/network-alert.js';

export const StationConnectivityOccurrenceDetailsSchema = z.object({
  durationSeconds: z.number().int().nullable().optional(),
});

export const ConnectorStatusOccurrenceDetailsSchema = z.object({
  status: ConnectorStatusEnumSchema,
  errorCode: ConnectorErrorCodeEnumSchema.nullable().optional(),
  vendorErrorCode: z.string().nullable().optional(),
});

export const OcppCallFailuresOccurrenceDetailsSchema = z.object({
  reason: OcppCallFailureReasonSchema,
  action: z.string(),
  correlationId: z.string(),
  errorCode: z.string().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
});

export const NetworkAlertOccurrenceBaseSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  alertId: z.number().int(),
  type: NetworkAlertTypeSchema,
  occurredAt: z.iso.datetime(),
  severity: NetworkAlertSeveritySchema,
});

export const StationConnectivityOccurrenceSchema = NetworkAlertOccurrenceBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.StationConnectivity),
  websocketEventId: z.number().int().nullable().optional(),
  details: StationConnectivityOccurrenceDetailsSchema,
});

export const ConnectorStatusOccurrenceSchema = NetworkAlertOccurrenceBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.ConnectorStatus),
  statusNotificationId: z.number().int().nullable().optional(),
  details: ConnectorStatusOccurrenceDetailsSchema,
});

export const OcppCallFailuresOccurrenceSchema = NetworkAlertOccurrenceBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.OcppCallFailures),
  ocppMessageId: z.number().int().nullable().optional(),
  details: OcppCallFailuresOccurrenceDetailsSchema,
});

export const NetworkAlertOccurrenceSchema = z.discriminatedUnion('type', [
  StationConnectivityOccurrenceSchema,
  ConnectorStatusOccurrenceSchema,
  OcppCallFailuresOccurrenceSchema,
]);

export const NetworkAlertOccurrenceProps = StationConnectivityOccurrenceSchema.keyof().enum;

export type NetworkAlertOccurrenceDto = z.infer<typeof NetworkAlertOccurrenceSchema>;

const createOmit = {
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
} as const;

export const NetworkAlertOccurrenceCreateSchema = z.discriminatedUnion('type', [
  StationConnectivityOccurrenceSchema.omit(createOmit),
  ConnectorStatusOccurrenceSchema.omit(createOmit),
  OcppCallFailuresOccurrenceSchema.omit(createOmit),
]);

export type NetworkAlertOccurrenceCreate = z.infer<typeof NetworkAlertOccurrenceCreateSchema>;

export const networkAlertOccurrenceSchemas = {
  NetworkAlertOccurrence: NetworkAlertOccurrenceSchema,
  NetworkAlertOccurrenceCreate: NetworkAlertOccurrenceCreateSchema,
};
