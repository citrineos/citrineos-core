// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { VersionNumber } from './version-number.js';
import type { Endpoint } from './endpoint.js';
import type { VersionDTO } from './dto/version-dto.js';
import type { VersionDetailsDTO } from './dto/version-details-dto.js';

export const ClientVersionSchema = z.object({
  version: z.nativeEnum(VersionNumber),
  url: z.string().url(),
  endpoints: z.custom<Endpoint[]>().optional(),
  clientInformationId: z.number().optional(),
});

export type ClientVersion = z.infer<typeof ClientVersionSchema>;

export const toVersionDTO = (cv: ClientVersion): VersionDTO => ({
  version: cv.version,
  url: cv.url,
});

export const toVersionDetailsDTO = (cv: ClientVersion): VersionDetailsDTO => ({
  version: cv.version,
  endpoints: cv.endpoints ?? [],
});
