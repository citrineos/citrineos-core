// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ConnectorStatusEnumSchema } from './enums.js';

export const NetworkAlertTypeSchema = z.enum([
  'StationConnectivity',
  'ConnectorStatus',
  'OcppCallFailures',
]);

export type NetworkAlertType = z.infer<typeof NetworkAlertTypeSchema>;

export const NetworkAlertSeveritySchema = z.enum(['Critical', 'Warning', 'Info']);

export type NetworkAlertSeverity = z.infer<typeof NetworkAlertSeveritySchema>;

export const NetworkAlertStatusSchema = z.enum(['Active', 'Acknowledged', 'Resolved']);

export type NetworkAlertStatus = z.infer<typeof NetworkAlertStatusSchema>;

export const NetworkAlertResolvedBySchema = z.enum(['Automatic', 'UserAction']);

export type NetworkAlertResolvedBy = z.infer<typeof NetworkAlertResolvedBySchema>;

export const OcppCallFailureReasonSchema = z.enum(['CallError', 'Timeout', 'SendFailed', 'Slow']);

export type OcppCallFailureReason = z.infer<typeof OcppCallFailureReasonSchema>;

export const StationConnectivityRulesSchema = z.object({
  disconnectSeverity: NetworkAlertSeveritySchema,
  frequentDisconnects: z.object({
    count: z.number().int().positive(),
    windowSeconds: z.number().int().positive(),
    severity: NetworkAlertSeveritySchema,
  }),
  offlineTooLong: z.object({
    seconds: z.number().int().positive(),
    severity: NetworkAlertSeveritySchema,
  }),
  // A station that has missed this many heartbeats is not reachable, whatever isOnline says.
  missedHeartbeats: z.number().int().positive(),
});

export const ConnectorStatusRulesSchema = z.object({
  severityByStatus: z.partialRecord(ConnectorStatusEnumSchema, NetworkAlertSeveritySchema),
});

export const OcppCallFailuresRulesSchema = z.object({
  severityByReason: z.record(OcppCallFailureReasonSchema, NetworkAlertSeveritySchema),
  criticalActions: z.array(z.string()),
  slowThresholdMs: z.number().int().positive(),
  // The sweep averages each station's latest responses in samples of this many; a full sample whose
  // average exceeds slowThresholdMs is one Slow occurrence.
  slowSampleSize: z.number().int().positive(),
  quietPeriodSeconds: z.number().int().positive(),
});

export const NetworkAlertRulesSchemas = {
  StationConnectivity: StationConnectivityRulesSchema,
  ConnectorStatus: ConnectorStatusRulesSchema,
  OcppCallFailures: OcppCallFailuresRulesSchema,
} as const satisfies Record<NetworkAlertType, z.ZodObject>;

export type NetworkAlertRules<T extends NetworkAlertType> = z.infer<
  (typeof NetworkAlertRulesSchemas)[T]
>;
