// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { CredentialsDTOSchema } from './DTO/CredentialsDTO.js';
import { OcpiResponseSchema, OcpiResponseStatusCode } from './OcpiResponse.js';

export const CredentialsResponseSchema = OcpiResponseSchema(CredentialsDTOSchema);
export const CredentialsResponseSchemaName = 'CredentialsResponse';

export type CredentialsResponse = z.infer<typeof CredentialsResponseSchema>;

export const buildCredentialsResponse = (
  data: z.infer<typeof CredentialsDTOSchema>,
  status_code: OcpiResponseStatusCode = OcpiResponseStatusCode.GenericSuccessCode,
  status_message?: string,
): z.infer<typeof CredentialsResponseSchema> => ({
  status_code,
  status_message,
  data,
  timestamp: new Date(),
});
