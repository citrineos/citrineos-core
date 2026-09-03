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
export * from '@modules/certificates/index.js';
export * from '@modules/configuration/index.js';
export * from '@modules/ev-driver/index.js';
export * from '@modules/monitoring/index.js';
export * from '@modules/ocpp-router/index.js';
export * from '@modules/reporting/index.js';
export * from '@modules/smart-charging/index.js';
export * from '@modules/tenant/index.js';
export * from '@modules/transactions/index.js';

// Handler exports
export * from '@handlers/index.js';

// Server support services (bootstrap-agnostic; the concrete server lives in the app)
export { HealthCheckService, type HealthCheckResult } from './src/server/health-check-service.js';
export { buildContainer, type Prebuilt } from './src/server/container.js';
