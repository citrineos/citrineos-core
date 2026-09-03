// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { VersionNumber } from './version-number.js';
import type { Endpoint } from './endpoint.js';
import { EndpointSchema } from './endpoint.js';
import type { VersionDTO } from './dto/version-dto.js';
import type { VersionDetailsDTO } from './dto/version-details-dto.js';

export const VersionSchema = z.object({
  id: z.number().optional(),
  version: z.nativeEnum(VersionNumber),
  url: z.string().url(),
  endpoints: z.array(EndpointSchema),
});

export type Version = z.infer<typeof VersionSchema>;

export const buildVersion = (
  version: VersionNumber,
  url: string,
  endpoints: Endpoint[],
): Version => ({
  version,
  url,
  endpoints,
});

export const toVersionDTO = (v: Version): VersionDTO => ({
  version: v.version,
  url: v.url,
});

export const toVersionDetailsDTO = (v: Version): VersionDetailsDTO => ({
  version: v.version,
  endpoints: v.endpoints,
});
