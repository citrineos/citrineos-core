// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Role } from './Role.js';
import {
  BusinessDetailsSchema,
  fromBusinessDetailsDTO,
  toBusinessDetailsDTO,
} from './BusinessDetails.js';
import type { CredentialsRoleDTO } from './DTO/CredentialsRoleDTO.js';

import { z } from 'zod';
import { CountryCode } from '../util/Util.js';

export const ClientCredentialsRoleSchema = z.object({
  role: z.literal(Role.EMSP),
  party_id: z.string().length(3),
  country_code: z.nativeEnum(CountryCode),
  business_details: BusinessDetailsSchema,
  clientInformationId: z.number(),
  cpoTenantId: z.number(),
});

export type ClientCredentialsRole = z.infer<typeof ClientCredentialsRoleSchema>;

export const toCredentialsRoleDTO = (
  clientCredentialsRole: ClientCredentialsRole,
): CredentialsRoleDTO => ({
  role: clientCredentialsRole.role,
  party_id: clientCredentialsRole.party_id,
  country_code: clientCredentialsRole.country_code,
  business_details: toBusinessDetailsDTO(clientCredentialsRole.business_details),
});

export const fromCredentialsRoleDTO = (dto: CredentialsRoleDTO): ClientCredentialsRole => {
  return ClientCredentialsRoleSchema.parse({
    role: dto.role,
    party_id: dto.party_id,
    country_code: dto.country_code,
    business_details: fromBusinessDetailsDTO(dto.business_details),
    clientInformationId: 1, // Fill with actual value if available
    cpoTenantId: 1, // Fill with actual value if available
  });
};
