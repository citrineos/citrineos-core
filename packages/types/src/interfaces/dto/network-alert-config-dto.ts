// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base-dto.js';
import {
  ConnectorStatusRulesSchema,
  NetworkAlertTypeSchema,
  OcppCallFailuresRulesSchema,
  StationConnectivityRulesSchema,
} from './types/network-alert.js';

// A null or absent field falls back to the system config default for that alert type.
// Rule overrides are shallow: a nested rule object replaces the default one whole.
export const NetworkAlertConfigBaseSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  type: NetworkAlertTypeSchema,
  enabled: z.boolean().nullable().optional(),
});

export const StationConnectivityConfigSchema = NetworkAlertConfigBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.StationConnectivity),
  rules: StationConnectivityRulesSchema.partial().nullable().optional(),
});

export const ConnectorStatusConfigSchema = NetworkAlertConfigBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.ConnectorStatus),
  rules: ConnectorStatusRulesSchema.partial().nullable().optional(),
});

export const OcppCallFailuresConfigSchema = NetworkAlertConfigBaseSchema.extend({
  type: z.literal(NetworkAlertTypeSchema.enum.OcppCallFailures),
  rules: OcppCallFailuresRulesSchema.partial().nullable().optional(),
});

export const NetworkAlertConfigSchema = z.discriminatedUnion('type', [
  StationConnectivityConfigSchema,
  ConnectorStatusConfigSchema,
  OcppCallFailuresConfigSchema,
]);

export const NetworkAlertConfigProps = StationConnectivityConfigSchema.keyof().enum;

export type NetworkAlertConfigDto = z.infer<typeof NetworkAlertConfigSchema>;

const createOmit = {
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
} as const;

export const NetworkAlertConfigCreateSchema = z.discriminatedUnion('type', [
  StationConnectivityConfigSchema.omit(createOmit),
  ConnectorStatusConfigSchema.omit(createOmit),
  OcppCallFailuresConfigSchema.omit(createOmit),
]);

export type NetworkAlertConfigCreate = z.infer<typeof NetworkAlertConfigCreateSchema>;

export const networkAlertConfigSchemas = {
  NetworkAlertConfig: NetworkAlertConfigSchema,
  NetworkAlertConfigCreate: NetworkAlertConfigCreateSchema,
};
