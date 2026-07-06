// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  buildOcpiRegistrationParams,
  OcpiRegistrationParamsSchema,
} from '../../util/OcpiRegistrationParams.js';
import type { CredentialsDTO } from '../../../model/DTO/CredentialsDTO.js';
import { CredentialsDTOSchema } from '../../../model/DTO/CredentialsDTO.js';
import { VersionNumber } from '../../../model/VersionNumber.js';

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
