// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Cross-cutting layer exports
export * from '@/config/index.js';
export * from '@/transport/index.js';
export * from '@/services/index.js';
export * from '@/apis/index.js';
export * from '@util/index.js';

// Module exports
export * from '@modules/Certificates/index.js';
export * from '@modules/Configuration/index.js';
export * from '@modules/EVDriver/index.js';
export * from '@modules/Monitoring/index.js';
export * from '@modules/OcppRouter/index.js';
export * from '@modules/Reporting/index.js';
export * from '@modules/SmartCharging/index.js';
export * from '@modules/Tenant/index.js';
export * from '@modules/Transactions/index.js';

// Handler exports
export * from '@handlers/index.js';

// Server support services (bootstrap-agnostic; the concrete server lives in the app)
export { HealthCheckService, type HealthCheckResult } from './src/server/HealthCheckService.js';
export { buildContainer, type Prebuilt } from './src/server/container.js';
