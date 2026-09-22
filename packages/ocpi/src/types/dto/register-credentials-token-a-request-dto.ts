// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { CredentialsRoleDTOSchema } from './credentials-role-dto.js';
import { CredentialsDTOSchema } from './credentials-dto.js';

export const RegisterCredentialsTokenARequestDTOSchema = z.object({
  url: z.string().url(),
  role: CredentialsRoleDTOSchema,
  credentials: CredentialsDTOSchema,
});
export const RegisterCredentialsTokenARequestDTOSchemaName = 'RegisterCredentialsTokenARequestDTO';

export type RegisterCredentialsTokenARequestDTO = z.infer<
  typeof RegisterCredentialsTokenARequestDTOSchema
>;
