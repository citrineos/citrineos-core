// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { VersionNumber } from './VersionNumber.js';
import type { Endpoint } from './Endpoint.js';
import { EndpointSchema } from './Endpoint.js';
import type { VersionDTO } from './DTO/VersionDTO.js';
import type { VersionDetailsDTO } from './DTO/VersionDetailsDTO.js';

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
