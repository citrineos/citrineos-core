// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { EvseTypeSchema } from './evse.type.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const ReservationSchema = BaseSchema.extend({
  databaseId: z.number().int(),
  id: z.number().int().optional(),
  stationId: z.string(),
  expiryDateTime: z.iso.datetime(),
  connectorType: z.string().nullable().optional(),
  reserveStatus: z.string().nullable().optional(),
  isActive: z.boolean().default(false),
  terminatedByTransaction: z.string().nullable().optional(),
  idToken: z.record(z.string(), z.any()),
  groupIdToken: z.record(z.string(), z.any()).nullable().optional(),
  evseId: z.number().int().nullable().optional(),
  evse: EvseTypeSchema.nullable().optional(),
});

export const ReservationProps = ReservationSchema.keyof().enum;

export type ReservationDto = z.infer<typeof ReservationSchema>;

export const ReservationCreateSchema = ReservationSchema.omit({
  databaseId: true,
  tenant: true,
  evse: true,
  updatedAt: true,
  createdAt: true,
});

export type ReservationCreate = z.infer<typeof ReservationCreateSchema>;

export const reservationSchemas = {
  Reservation: ReservationSchema,
  ReservationCreate: ReservationCreateSchema,
};
