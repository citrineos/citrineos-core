// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { CredentialsRoleDTOSchema } from './CredentialsRoleDTO.js';

export const CredentialsDTOSchema = z.object({
  token: z.string().max(64),
  url: z.string().url(),
  roles: z.array(CredentialsRoleDTOSchema).min(1),
});
export const CredentialsDTOSchemaName = 'CredentialsDTO';

export type CredentialsDTO = z.infer<typeof CredentialsDTOSchema>;
