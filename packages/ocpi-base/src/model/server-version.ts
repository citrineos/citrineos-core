// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { VersionNumber } from './version-number.js';
import type { Endpoint } from './endpoint.js';
import type { VersionDTO } from './dto/version-dto.js';
import type { VersionDetailsDTO } from './dto/version-details-dto.js';

export const ServerVersionSchema = z.object({
  version: z.nativeEnum(VersionNumber),
  url: z.string().url(),
  // excluded fields
  endpoints: z.custom<Endpoint[]>().optional(),
  clientInformationId: z.number().optional(),
});

export type ServerVersion = z.infer<typeof ServerVersionSchema>;

export const toVersionDTO = (sv: ServerVersion): VersionDTO => ({
  version: sv.version,
  url: sv.url,
});

export const toVersionDetailsDTO = (sv: ServerVersion): VersionDetailsDTO => ({
  version: sv.version,
  endpoints: sv.endpoints ?? [],
});
