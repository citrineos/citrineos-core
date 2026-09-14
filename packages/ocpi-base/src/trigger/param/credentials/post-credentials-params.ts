// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  buildOcpiRegistrationParams,
  OcpiRegistrationParamsSchema,
} from '../../util/ocpi-registration-params.js';
import type { CredentialsDTO } from '../../../model/dto/credentials-dto.js';
import { CredentialsDTOSchema } from '../../../model/dto/credentials-dto.js';
import { VersionNumber } from '../../../model/version-number.js';

import { z } from 'zod';

export const PostCredentialsParamsSchema = OcpiRegistrationParamsSchema.extend({
  credentials: CredentialsDTOSchema,
});

export type PostCredentialsParams = z.infer<typeof PostCredentialsParamsSchema>;

export const buildPostCredentialsParams = (
  version: VersionNumber,
  authorization: string,
  credentials: CredentialsDTO,
  xRequestId?: string,
  xCorrelationId?: string,
): PostCredentialsParams => {
  return {
    ...buildOcpiRegistrationParams(version, authorization, xRequestId, xCorrelationId),
    credentials,
  };
};
