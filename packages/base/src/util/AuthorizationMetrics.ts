// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { metrics } from '@opentelemetry/api';

/**
 * Application-level authorization outcome counter. A *denied* authorization
 * comes back as a valid CallResult with status = Blocked/Invalid/Expired — NOT
 * an OCPP CallError — so transport-level metrics can't see it.
 * `Invalid`/`Blocked` for tokens that should be `Accepted` is silently broken.
 */
const authorizeResultTotal = metrics
  .getMeter('citrineos.ocpp')
  .createCounter('ocpp_authorize_result_total', {
    description: 'Authorization decisions by status, OCPP version, and originating action',
  });

/**
 * Records the outcome of an authorization decision. Call this at the point
 * where the final authorization status is determined, on every path that emits
 * one — the explicit `Authorize` message, and the authorization embedded in
 * `TransactionEvent` (2.x) and `StartTransaction` (1.6) responses.
 *
 * The `action` label keeps the explicit-Authorize series separable from the
 * transaction-embedded ones on dashboards. `status` is stringified so it works
 * across the different OCPP status enums (idTokenInfo / idTagInfo).
 */
export function recordAuthorizeResult(params: {
  status: unknown;
  ocppVersion: string;
  action: 'Authorize' | 'TransactionEvent' | 'StartTransaction';
}): void {
  authorizeResultTotal.add(1, {
    status:
      params.status !== undefined && params.status !== null ? String(params.status) : 'unknown',
    ocpp_version: params.ocppVersion,
    action: params.action,
  });
}
