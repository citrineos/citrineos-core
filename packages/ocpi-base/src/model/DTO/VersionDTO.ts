// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { VersionNumber } from '../VersionNumber.js';

export const VersionDTOSchema = z.object({
  version: z.nativeEnum(VersionNumber),
  url: z.string().url(),
});

export type VersionDTO = z.infer<typeof VersionDTOSchema>;
