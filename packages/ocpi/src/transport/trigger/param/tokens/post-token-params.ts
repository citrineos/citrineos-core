// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { TokenType } from '../../../../types/token-type.js';
import { VersionNumber } from '../../../../types/version-number.js';
import { OcpiParamsSchema } from '../../util/ocpi-params.js';
import { LocationReferencesSchema } from '../../../../types/location-references.js';

export const PostTokenParamsSchema = OcpiParamsSchema.extend({
  tokenId: z.string().length(36),
  type: z.nativeEnum(TokenType).optional(),
  locationReferences: LocationReferencesSchema.optional(),
  version: z.nativeEnum(VersionNumber).optional(),
});

export type PostTokenParams = z.infer<typeof PostTokenParamsSchema>;
