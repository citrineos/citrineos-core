export class TenantContextManager {
  private static readonly schemaPrefix = 'tenant_';

  static getSchemaForTenant(tenantId: number): string {
    return `${this.schemaPrefix}${tenantId}`;
  }
}
