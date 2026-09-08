// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { VersionNumber } from '../../../model/version-number.js';
import type { CredentialsDTO } from '../../../model/dto/credentials-dto.js';
import { CredentialsDTOSchema } from '../../../model/dto/credentials-dto.js';
import { OcpiRegistrationParamsSchema } from '../../util/ocpi-registration-params.js';

export const PutCredentialsParamsSchema = OcpiRegistrationParamsSchema.extend({
  credentials: CredentialsDTOSchema,
});

export type PutCredentialsParams = z.infer<typeof PutCredentialsParamsSchema>;

export const buildPutCredentialsParams = (
  version: VersionNumber,
  authorization: string,
  credentials: CredentialsDTO,
): PutCredentialsParams => ({
  authorization,
  version,
  credentials,
});
