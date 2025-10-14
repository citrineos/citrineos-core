// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
export class TenantContextManager {
  private static readonly schemaPrefix = 'tenant_';

  static getSchemaForTenant(tenantId: number): string {
    return `${this.schemaPrefix}${tenantId}`;
  }
}
