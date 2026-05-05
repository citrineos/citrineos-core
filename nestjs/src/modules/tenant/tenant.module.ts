// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { TenantRepository } from '@repositories/tenant.repository';

/**
 * Tenant CRUD is exposed via Hasura against the `Tenants` table — no
 * bespoke REST controller needed. The repository stays for handlers that
 * need to look up tenant rows during request processing.
 */
@Module({
  providers: [TenantRepository],
  exports: [TenantRepository],
})
export class TenantModule {}
