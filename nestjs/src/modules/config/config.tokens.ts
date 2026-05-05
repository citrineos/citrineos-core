// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Per-section AppConfig injection tokens.
 *
 * Consumers should inject the narrowest token they need rather than the
 * full `APP_CONFIG`. Only `main.ts`, the env-merge bootstrap, and a few
 * diagnostics paths need the whole tree.
 *
 * All tokens resolve through factory providers in `app-config.module.ts`,
 * so consumers don't construct anything — DI hands back the live slice.
 */

// ─── Top-level slices ────────────────────────────────────────────────────────

export const CENTRAL_SYSTEM_CONFIG = Symbol('CENTRAL_SYSTEM_CONFIG');
export const DATABASE_CONFIG = Symbol('DATABASE_CONFIG');
export const MODULES_CONFIG = Symbol('MODULES_CONFIG');
export const UTIL_CONFIG = Symbol('UTIL_CONFIG');

/**
 * Cross-cutting timeout / sizing limits pulled out of the top-level
 * AppConfig (maxCachingSeconds, maxCallLengthSeconds, etc.). Avoids
 * the entire AppConfig leaking into AbstractOcppModule and other
 * pure-runtime code that just needs the cache TTL.
 */
export const CONFIG_LIMITS = Symbol('CONFIG_LIMITS');

export interface ConfigLimits {
  maxCachingSeconds: number;
  maxCallLengthSeconds: number;
  maxReconnectDelay: number;
  realTimeAuthDefaultTimeoutSeconds: number;
}

// ─── Util sub-slices ─────────────────────────────────────────────────────────

export const CACHE_CONFIG = Symbol('CACHE_CONFIG');
export const MESSAGE_BROKER_CONFIG = Symbol('MESSAGE_BROKER_CONFIG');
export const AUTH_PROVIDER_CONFIG = Symbol('AUTH_PROVIDER_CONFIG');
export const SWAGGER_CONFIG = Symbol('SWAGGER_CONFIG');
export const NETWORK_CONNECTION_CONFIG = Symbol('NETWORK_CONNECTION_CONFIG');
export const CERTIFICATE_AUTHORITY_CONFIG = Symbol('CERTIFICATE_AUTHORITY_CONFIG');
export const TELEMETRY_CONFIG = Symbol('TELEMETRY_CONFIG');

// ─── Per-module slices ───────────────────────────────────────────────────────

export const CONFIGURATION_MODULE_CONFIG = Symbol('CONFIGURATION_MODULE_CONFIG');
export const EVDRIVER_MODULE_CONFIG = Symbol('EVDRIVER_MODULE_CONFIG');
export const MONITORING_MODULE_CONFIG = Symbol('MONITORING_MODULE_CONFIG');
export const REPORTING_MODULE_CONFIG = Symbol('REPORTING_MODULE_CONFIG');
export const SMARTCHARGING_MODULE_CONFIG = Symbol('SMARTCHARGING_MODULE_CONFIG');
export const TRANSACTIONS_MODULE_CONFIG = Symbol('TRANSACTIONS_MODULE_CONFIG');
export const CERTIFICATES_MODULE_CONFIG = Symbol('CERTIFICATES_MODULE_CONFIG');
export const TENANT_MODULE_CONFIG = Symbol('TENANT_MODULE_CONFIG');
