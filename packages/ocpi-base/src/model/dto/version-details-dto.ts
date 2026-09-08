// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { VersionNumber } from '../version-number.js';
import { EndpointSchema } from '../endpoint.js';

export const VersionDetailsDTOSchema = z.object({
  version: z.nativeEnum(VersionNumber),
  endpoints: z.array(EndpointSchema).min(1),
});

export type VersionDetailsDTO = z.infer<typeof VersionDetailsDTOSchema>;
