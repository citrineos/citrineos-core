// Source: @citrineos/base/src/interfaces/messages/internal-types.ts
// Copied locally — base package is ESM-only and incompatible with NestJS CommonJS.

export enum EventGroup {
  All = 'all',
  Router = 'router',
  Modules = 'modules',
  Certificates = 'certificates',
  Configuration = 'configuration',
  EVDriver = 'evdriver',
  Monitoring = 'monitoring',
  Reporting = 'reporting',
  SmartCharging = 'smartcharging',
  Tenant = 'tenant',
  Transactions = 'transactions',
}
