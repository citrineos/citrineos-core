// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const PointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.array(z.number()), // [longitude, latitude], doesn't restrict to 2 elements bc geojson Point type doesn't
});

export const LocationHoursSchema = z.any();

export const StatusInfoSchema = z.object({
  reasonCode: z.string(),
  additionalInfo: z.string().nullable().optional(),
  customData: z.any().nullable().optional(),
});

export type StatusInfo = z.infer<typeof StatusInfoSchema>;
