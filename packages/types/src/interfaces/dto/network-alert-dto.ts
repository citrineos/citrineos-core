// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base-dto.js';
import { ConnectorErrorCodeEnumSchema, ConnectorStatusEnumSchema } from './types/enums.js';
import {
  NetworkAlertResolvedBySchema,
  NetworkAlertSeveritySchema,
  NetworkAlertStatusSchema,
  NetworkAlertTypeSchema,
  OcppCallFailureReasonSchema,
} from './types/network-alert.js';

export const StationConnectivityDetailsSchema = z.object({
  offlineSince: z.iso.datetime().nullable(),
});

export const ConnectorStatusDetailsSchema = z.object({
  status: ConnectorStatusEnumSchema,
  errorCode: ConnectorErrorCodeEnumSchema.nullable().optional(),
});

export const OcppCallFailuresDetailsSchema = z.object({
  reasons: z.array(OcppCallFailureReasonSchema),
  actions: z.array(z.string()),
});

export const NetworkAlertBaseSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  type: NetworkAlertTypeSchema,
  severity: NetworkAlertSeveritySchema,
  status: NetworkAlertStatusSchema,
  stationId: z.number().int().nullable().optional(),
  evseId: z.number().int().nullable().optional(),
  connectorId: z.number().int().nullable().optional(),
  firstSeenAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime(),
  occurrenceCount: z.number().int().min(1),
  resolvedAt: z.iso.datetime().nullable().optional(),
  resolvedBy: NetworkAlertResolvedBySchema.nullable().optional(),
  statusNote: z.string().nullable().optional(),
});

export const StationConnectivityAlertSchema = NetworkAlertBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.StationConnectivity),
  details: StationConnectivityDetailsSchema,
});

export const ConnectorStatusAlertSchema = NetworkAlertBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.ConnectorStatus),
  details: ConnectorStatusDetailsSchema,
});

export const OcppCallFailuresAlertSchema = NetworkAlertBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.OcppCallFailures),
  details: OcppCallFailuresDetailsSchema,
});

export const NetworkAlertSchema = z.discriminatedUnion('type', [
  StationConnectivityAlertSchema,
  ConnectorStatusAlertSchema,
  OcppCallFailuresAlertSchema,
]);

export const NetworkAlertProps = StationConnectivityAlertSchema.keyof().enum;

export type NetworkAlertDto = z.infer<typeof NetworkAlertSchema>;

const createOmit = {
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
} as const;

export const NetworkAlertCreateSchema = z.discriminatedUnion('type', [
  StationConnectivityAlertSchema.omit(createOmit),
  ConnectorStatusAlertSchema.omit(createOmit),
  OcppCallFailuresAlertSchema.omit(createOmit),
]);

export type NetworkAlertCreate = z.infer<typeof NetworkAlertCreateSchema>;

export const NetworkAlertUpdateSchema = NetworkAlertBaseSchema.pick({
  severity: true,
  status: true,
  firstSeenAt: true,
  lastSeenAt: true,
  occurrenceCount: true,
  resolvedAt: true,
  resolvedBy: true,
})
  .extend({
    details: z.union([
      StationConnectivityDetailsSchema,
      ConnectorStatusDetailsSchema,
      OcppCallFailuresDetailsSchema,
    ]),
  })
  .partial();

export type NetworkAlertUpdate = z.infer<typeof NetworkAlertUpdateSchema>;

export const networkAlertSchemas = {
  NetworkAlert: NetworkAlertSchema,
  NetworkAlertCreate: NetworkAlertCreateSchema,
  NetworkAlertUpdate: NetworkAlertUpdateSchema,
};
