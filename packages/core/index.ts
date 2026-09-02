// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Core module exports
export * from '@dal/index.js';
export * from '@util/index.js';

// Module exports
export { CommandsApi } from '@modules/Api/src/module/CommandsApi.js';
export { OcppMessageApi } from '@modules/Api/src/module/OcppMessageApi.js';
export { WebPaymentApi } from '@modules/Api/src/module/WebPaymentApi.js';
export { registerApiServices } from '@modules/Api/src/register.js';
export * from '@modules/Certificates/src/index.js';
export * from '@modules/Configuration/src/index.js';
export * from '@modules/EVDriver/src/index.js';
export * from '@modules/Monitoring/src/index.js';
export * from '@modules/OcppRouter/src/index.js';
export * from '@modules/Reporting/src/index.js';
export * from '@modules/SmartCharging/src/index.js';
export * from '@modules/Tenant/src/index.js';
export * from '@modules/Transactions/src/index.js';

// Handler exports
export * from '@handlers/index.js';

// Server support services (bootstrap-agnostic; the concrete server lives in the app)
export { HealthCheckService, type HealthCheckResult } from './src/server/HealthCheckService.js';

export { buildContainer, type Prebuilt } from './src/server/container.js';
