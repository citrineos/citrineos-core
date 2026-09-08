// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BusinessDetails } from './business-details.js';
import { Role } from './role.js';
import type { ClientInformation } from './client-information.js';
import type { CpoTenant } from './cpo-tenant.js';

export interface ICredentialsRole {
  role: Role;
  business_details: BusinessDetails;
  cpoTenantId: number;
  cpoTenant: CpoTenant;
  clientInformationId?: number;
  clientInformation?: ClientInformation;
}

export class BaseCredentialsRole implements ICredentialsRole {
  role!: Role;
  business_details!: BusinessDetails;
  cpoTenantId!: number;
  cpoTenant!: CpoTenant;
  clientInformationId!: number;
  clientInformation!: ClientInformation;
}
