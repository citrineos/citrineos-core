// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base-dto.js';
import { AuthorizationAttemptReasonSchema } from './types/authorization-attempt.js';
import { AuthorizationStatusEnumSchema } from './types/enums.js';

export const AuthorizationAttemptSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.number().int().nullable().optional(),
  ocppVersion: z.string(),
  action: z.string(),
  correlationId: z.string(),
  timestamp: z.iso.datetime(),
  idToken: z.string(),
  // Absent for OCPP 1.6, whose idTag carries no type.
  idTokenType: z.string().nullable().optional(),
  authorizationId: z.number().int().nullable().optional(),
  // The Authorization's status when the attempt was evaluated; the row itself may change later.
  storedStatus: AuthorizationStatusEnumSchema.nullable().optional(),
  // The status as sent on the wire, in the vocabulary of the message's OCPP version. Absent when
  // nothing was sent or received, e.g. a remote start that timed out.
  responseStatus: z.string().nullable().optional(),
  reason: AuthorizationAttemptReasonSchema,
  details: z.record(z.string(), z.unknown()).nullable().optional(),
  evseId: z.number().int().nullable().optional(),
  connectorId: z.number().int().nullable().optional(),
  transactionDatabaseId: z.number().int().nullable().optional(),
  transactionCreatedAt: z.date().nullable().optional(),
  transactionId: z.string().nullable().optional(),
  remoteStartId: z.number().int().nullable().optional(),
});

export const AuthorizationAttemptProps = AuthorizationAttemptSchema.keyof().enum;

export type AuthorizationAttemptDto = z.infer<typeof AuthorizationAttemptSchema>;

export const AuthorizationAttemptCreateSchema = AuthorizationAttemptSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type AuthorizationAttemptCreate = z.infer<typeof AuthorizationAttemptCreateSchema>;

export const authorizationAttemptSchemas = {
  AuthorizationAttempt: AuthorizationAttemptSchema,
  AuthorizationAttemptCreate: AuthorizationAttemptCreateSchema,
};
