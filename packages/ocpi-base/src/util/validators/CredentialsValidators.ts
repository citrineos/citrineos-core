// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BadRequestError } from 'routing-controllers';
import type { CredentialsRoleDTO } from '../../model/DTO/CredentialsRoleDTO.js';
import { Role } from '../../model/Role.js';

export function validateRole(credentialsRoles: CredentialsRoleDTO[], role: Role) {
  for (const credentialsRole of credentialsRoles) {
    if (credentialsRole.role !== role) {
      throw new BadRequestError(
        `The CredentialsRole with country_code ${credentialsRole.country_code} and party_id ${credentialsRole.party_id} is a not ${role} role`,
      );
    }
  }
}
