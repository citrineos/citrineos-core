// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { Role } from './Role.js';
import { BusinessDetailsSchema } from './BusinessDetails.js';

export const ServerCredentialsRoleSchema = z.object({
  role: z.literal(Role.CPO),
  party_id: z.string().length(3),
  country_code: z.string().length(2),
  business_details: BusinessDetailsSchema,
  cpoTenantId: z.number(),
});

export type ServerCredentialsRole = z.infer<typeof ServerCredentialsRoleSchema>;

/* static buildServerCredentialsRole(
   countryCode: string,
   partyId: string,
   businessDetails: BusinessDetails,
 ) {
   const serverCredentialsRole = new ServerCredentialsRole();
   serverCredentialsRole.country_code = countryCode;
   serverCredentialsRole.party_id = partyId;
   serverCredentialsRole.business_details = businessDetails;
   return serverCredentialsRole;
 }

 static toCredentialsRoleDTO(
   serverCredentialsRole: ServerCredentialsRole,
 ): CredentialsRoleDTO {
   const credentialsRoleDTO = new CredentialsRoleDTO();
   credentialsRoleDTO.role =
     serverCredentialsRole[ServerCredentialsRoleProps.role];
   credentialsRoleDTO.party_id =
     serverCredentialsRole[ServerCredentialsRoleProps.partyId];
   credentialsRoleDTO.country_code =
     serverCredentialsRole[ServerCredentialsRoleProps.countryCode];
   if (serverCredentialsRole[ServerCredentialsRoleProps.businessDetails]) {
     credentialsRoleDTO.business_details = toBusinessDetailsDTO(
       serverCredentialsRole[ServerCredentialsRoleProps.businessDetails],
     );
   }
   return credentialsRoleDTO;
 }*/
