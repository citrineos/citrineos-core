// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { CountryCode } from '../util/Util.js';

export const OcpiReservationSchema = z.object({
  coreReservationId: z.number(),
  locationId: z.number(),
  reservationId: z.string().max(36),
  countryCode: z.nativeEnum(CountryCode),
  partyId: z.string().max(3),
  evseUid: z.string().max(36).nullable().optional(),
  authorizationReference: z.string().max(36).nullable().optional(),
});

export type OcpiReservation = z.infer<typeof OcpiReservationSchema>;
