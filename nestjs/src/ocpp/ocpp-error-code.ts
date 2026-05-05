// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP CallError codes per OCPP-J 1.6 §4.2.2 / OCPP 2.0.1 §3.2.4. The wire
 * frame `[4, msgId, errorCode, errorDescription, errorDetails]` carries
 * one of these strings as `errorCode`.
 *
 * Kept as a string-valued enum (rather than `as const`) so existing
 * `errorCode: string` interfaces accept it without a cast and `??` defaults
 * to `'GenericError'` continue to work.
 */
export enum OcppErrorCode {
  /** Payload missing a required field. */
  FormationViolation = 'FormationViolation',
  /** Field has the wrong type / format. */
  TypeConstraintViolation = 'TypeConstraintViolation',
  /** Field has a value outside the allowed range / enum. */
  PropertyConstraintViolation = 'PropertyConstraintViolation',
  /** Required field absent for the given context (e.g. requestId on TriggerMessage). */
  OccurrenceConstraintViolation = 'OccurrenceConstraintViolation',
  /** Action not implemented at this CSMS. */
  NotImplemented = 'NotImplemented',
  /** Action implemented but not supported on this OCPP version. */
  NotSupported = 'NotSupported',
  /** Internal error not falling into a more specific bucket. */
  InternalError = 'InternalError',
  /** Couldn't parse the inbound frame. */
  ProtocolError = 'ProtocolError',
  /** Charger sent an action against an inactive security profile. */
  SecurityError = 'SecurityError',
  /** RPC framework error (rare; usually swallowed at the WS layer). */
  RpcFrameworkError = 'RpcFrameworkError',
  /** Default catch-all when none of the above fit. */
  GenericError = 'GenericError',
}
