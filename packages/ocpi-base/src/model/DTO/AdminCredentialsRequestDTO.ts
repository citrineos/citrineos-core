// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { CredentialsRoleDTOSchema } from './CredentialsRoleDTO.js';
import { CountryCode } from '../../util/Util.js';

export const AdminCredentialsRequestDTOSchema = z.object({
  url: z.string().url(),
  role: CredentialsRoleDTOSchema,
  mspCountryCode: z.nativeEnum(CountryCode),
  mspPartyId: z.string(),
});
export const AdminCredentialsRequestDTOSchemaName = 'AdminCredentialsRequestDTO';

export type AdminCredentialsRequestDTO = z.infer<typeof AdminCredentialsRequestDTOSchema>;
