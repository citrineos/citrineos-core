// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Path-segment constants for the `/ocpp/{version}/{module}/{action}`
 * REST surface. Const-enum so the compiler inlines them at the call
 * site — zero runtime cost compared to inline string literals.
 */

export const enum OCPPVersionSegment {
  V1_6 = '1.6',
  V2_0_1 = '2.0.1',
  V2_1 = '2.1',
}

export const enum ModuleSegment {
  Configuration = 'configuration',
  EVDriver = 'evdriver',
  SmartCharging = 'smartcharging',
  Reporting = 'reporting',
  Monitoring = 'monitoring',
  Certificates = 'certificates',
  Tenant = 'tenant',
  Transactions = 'transactions',
}

/**
 * Compose an `/ocpp/{version}/{module}/{action}` route segment.
 *
 * The `@Controller('ocpp')` prefix already applies, so callers pass
 * just `version/module/action`.
 *
 * Returns a readonly template literal type so `@Post(ocppRoute(...))`
 * receives a typed, narrow string.
 */
export const ocppRoute = <V extends OCPPVersionSegment, M extends ModuleSegment, A extends string>(
  version: V,
  module: M,
  action: A,
): `${V}/${M}/${A}` => `${version}/${module}/${action}`;
