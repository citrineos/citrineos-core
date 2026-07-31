// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP transport & message-flow metrics.
 *
 * These instruments feed whatever global OpenTelemetry MeterProvider is
 * registered in the process.
 *
 * The instruments themselves are module-private. Emit metrics through the
 * exported `record*` helpers so that label KEYS and their closed-set VALUES are
 * enforced by the compiler at every call site (a typo like `outcome: 'snet'`
 * fails to compile). Open-ended labels (`action`, `ocpp_version`, close/error
 * codes) stay typed as `string` — they are inherently high-cardinality.
 */

import { MessageTypeId } from '@citrineos/types';
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('citrineos.ocpp');

// --- Label vocabularies ------------------------------------------------------
// Closed sets of label values, kept next to the metric they describe.

/** `result` on {@link recordWsUpgrade}: the earliest connection decision point. */
export const WsUpgradeResult = {
  Upgraded: 'upgraded',
  AuthFailed: 'auth_failed',
  BrokerUnavailable: 'broker_unavailable',
  TenantUnresolved: 'tenant_unresolved',
  InternalError: 'internal_error',
} as const;
export type WsUpgradeResult = (typeof WsUpgradeResult)[keyof typeof WsUpgradeResult];

/** `reason` on {@link recordWsConnectionRejected}: which post-upgrade stage failed. */
export const WsRejectReason = {
  NoProtocol: 'no_protocol',
  UnknownStation: 'unknown_station',
  TenantLimit: 'tenant_limit',
  SlotTaken: 'slot_taken',
  RegisterFailed: 'register_failed',
  ConnectionFailed: 'connection_failed',
} as const;
export type WsRejectReason = (typeof WsRejectReason)[keyof typeof WsRejectReason];

/** `reason` on {@link recordWsSendFailure}: why a send to a station failed. */
export const WsSendFailureReason = {
  NoCache: 'no_cache',
  NoSocket: 'no_socket',
  NotOpen: 'not_open',
  SendError: 'send_error',
} as const;
export type WsSendFailureReason = (typeof WsSendFailureReason)[keyof typeof WsSendFailureReason];

/** `outcome` on {@link recordOcppCallSent}: fate of a CSMS-initiated Call send. */
export const CallSentOutcome = {
  Sent: 'sent',
  SendFailed: 'send_failed',
  Rejected: 'rejected',
} as const;
export type CallSentOutcome = (typeof CallSentOutcome)[keyof typeof CallSentOutcome];

/** `outcome` on {@link recordOcppCallResultSent}: fate of a CallResult reply. */
export const CallResultSentOutcome = {
  Sent: 'sent',
  SendFailed: 'send_failed',
  NoPendingRequest: 'no_pending_request',
  ActionMismatch: 'action_mismatch',
} as const;
export type CallResultSentOutcome =
  (typeof CallResultSentOutcome)[keyof typeof CallResultSentOutcome];

/** `outcome` on {@link recordOcppCallHandled}: whether an inbound Call routed. */
export const CallHandledOutcome = {
  Result: 'result',
  Error: 'error',
} as const;
export type CallHandledOutcome = (typeof CallHandledOutcome)[keyof typeof CallHandledOutcome];

/** `outcome` on {@link recordOcppCallResponse}: type of response to a CSMS Call. */
export const CallResponseOutcome = {
  Result: 'result',
  Error: 'error',
  OrphanOrTimeout: 'orphan_or_timeout',
} as const;
export type CallResponseOutcome = (typeof CallResponseOutcome)[keyof typeof CallResponseOutcome];

/** `action` label value used when the real action could not be determined. */
export const UNKNOWN_ACTION = 'unknown';

// --- WebSocket connection lifecycle ------------------------------------------

/**
 * Upgrade/authentication outcomes. `result` is the earliest decision point:
 * upgraded | auth_failed | broker_unavailable | tenant_unresolved | internal_error.
 */
const wsUpgradeTotal = meter.createCounter('ocpp_ws_upgrade_total', {
  description: 'WebSocket upgrade/authentication attempts, by result',
});

/**
 * Connections that completed the FULL registration path (auth -> station check
 * -> tenant limit -> cache slot claim -> router register -> broker subscribe).
 */
const wsConnectionEstablishedTotal = meter.createCounter('ocpp_ws_connection_established_total', {
  description: 'WebSocket connections that completed full registration',
});

/**
 * Connections rejected AFTER a successful upgrade, by `reason`:
 * no_protocol | unknown_station | tenant_limit | slot_taken | register_failed |
 * connection_failed. Splitting these tells you which stage regressed.
 */
const wsConnectionRejectedTotal = meter.createCounter('ocpp_ws_connection_rejected_total', {
  description: 'Connections rejected after upgrade, by reason',
});

/** Time from the `connection` event to full registration ("all the way"). */
const wsConnectionSetupDuration = meter.createHistogram(
  'ocpp_ws_connection_setup_duration_seconds',
  {
    description: 'Time from connection event to full registration',
    unit: 's',
  },
);

/** Closes by WebSocket close `code` (1000/1001 normal, 1006/1011/1013 abnormal). */
const wsConnectionClosedTotal = meter.createCounter('ocpp_ws_connection_closed_total', {
  description: 'WebSocket connections closed, by close code',
});

/** Currently-active connections (source of truth: _identifierConnections). */
const wsActiveConnections = meter.createUpDownCounter('ocpp_ws_active_connections', {
  description: 'Currently active WebSocket connections',
});

/** Failures sending to a station, by `reason`: no_cache | no_socket | not_open | send_error. */
const wsSendFailureTotal = meter.createCounter('ocpp_ws_send_failure_total', {
  description: 'Failures sending a message to a charging station, by reason',
});

/** A WebSocket upgrade/authentication attempt resolved to `result`. */
export function recordWsUpgrade(result: WsUpgradeResult): void {
  wsUpgradeTotal.add(1, { result });
}

/** A connection completed the full registration path on the given OCPP version. */
export function recordWsConnectionEstablished(ocppVersion: string): void {
  wsConnectionEstablishedTotal.add(1, { ocpp_version: ocppVersion });
}

/** A connection was rejected after a successful upgrade, at stage `reason`. */
export function recordWsConnectionRejected(reason: WsRejectReason): void {
  wsConnectionRejectedTotal.add(1, { reason });
}

/** Records connection-setup latency (seconds) for the given OCPP version. */
export function recordWsConnectionSetupDuration(seconds: number, ocppVersion: string): void {
  wsConnectionSetupDuration.record(seconds, { ocpp_version: ocppVersion });
}

/** A WebSocket connection closed with the given close `code`. */
export function recordWsConnectionClosed(code: number | string): void {
  wsConnectionClosedTotal.add(1, { code: String(code) });
}

/** Adjusts the active-connection gauge by `delta` (+1 on open, -1 on close). */
export function recordWsActiveConnectionsDelta(delta: number): void {
  wsActiveConnections.add(delta);
}

/** A message send to a station failed for `reason`. */
export function recordWsSendFailure(reason: WsSendFailureReason): void {
  wsSendFailureTotal.add(1, { reason });
}

// --- OCPP message flow -------------------------------------------------------

/** Every inbound OCPP frame, by `message_type` (Call|CallResult|CallError) and `ocpp_version`. */
const ocppMessageReceivedTotal = meter.createCounter('ocpp_message_received_total', {
  description: 'Inbound OCPP messages, by message type and OCPP version',
});

/**
 * Inbound OCPP messages that were successfully routed onward (accepted by the
 * broker), by `action` and `ocpp_version`. This is the "handled" leg of the
 * funnel: `ocpp_message_received_total - ocpp_message_routed_total` is the count
 * of inbound frames that failed somewhere between receipt and routing — parse
 * failures, unknown message types, pre-routing validation errors, broker send
 * failures, and message types with no routing (e.g. inbound CallError).
 */
const ocppMessageRoutedTotal = meter.createCounter('ocpp_message_routed_total', {
  description: 'Inbound OCPP messages successfully routed onward, by action and OCPP version',
});

/**
 * Station-initiated Calls processed by the router, by `action` and `outcome`:
 *   - `result` = the Call was successfully routed to the broker for a module to
 *     handle. This is NOT the CallResult reply — that is sent later,
 *     asynchronously, by the handling module (see `ocppCallResultSentTotal`).
 *   - `error` = routing failed or threw; the CSMS replied to the station with a
 *     CallError, and `error_code` carries the OCPP code.
 */
const ocppCallHandledTotal = meter.createCounter('ocpp_call_handled_total', {
  description: 'Station-initiated Calls processed by the router, by action and outcome',
});

/**
 * CSMS-initiated Calls sent to stations, by `action`, `ocpp_version` and
 * `outcome` (sent | send_failed | rejected). This is the missing denominator for
 * `ocppCallResponseTotal`: `ocpp_call_sent_total{outcome="sent"}` minus the
 * responses received is the count of Calls the station never answered (true
 * timeouts, which are otherwise invisible). Re-sends of an in-flight Call are
 * NOT counted.
 */
const ocppCallSentTotal = meter.createCounter('ocpp_call_sent_total', {
  description: 'CSMS-initiated Calls sent to stations, by action, OCPP version and outcome',
});

/**
 * CallResult replies the CSMS sends back to stations for station-initiated
 * Calls, by `action`, `ocpp_version` and `outcome`
 * (sent | send_failed | no_pending_request | action_mismatch). This is the real
 * "CSMS replied with a CallResult" event (distinct from `ocppCallHandledTotal`,
 * which only marks that the inbound Call was routed for handling).
 */
const ocppCallResultSentTotal = meter.createCounter('ocpp_call_result_sent_total', {
  description: 'CallResult replies sent to stations, by action, OCPP version and outcome',
});

/**
 * Responses to CSMS-initiated Calls, by `action` and `outcome`
 * (result | error | orphan_or_timeout), plus `error_code` on CallError.
 * `orphan_or_timeout` = a response arrived with no pending request cached
 * (a strong "call timed out" proxy).
 */
const ocppCallResponseTotal = meter.createCounter('ocpp_call_response_total', {
  description: 'Responses to CSMS-initiated Calls, by action and outcome',
});

/** Round-trip latency for CSMS-initiated Calls, by `action`. */
const ocppCallRoundtripDuration = meter.createHistogram('ocpp_call_roundtrip_duration_seconds', {
  description: 'Round-trip latency for CSMS-initiated Calls',
  unit: 's',
});

/**
 * An inbound OCPP frame was received. `messageTypeId` is mapped to its name
 * (Call|CallResult|CallError); `undefined` records as `unknown`.
 */
export function recordOcppMessageReceived(
  messageTypeId: MessageTypeId | undefined,
  ocppVersion: string,
): void {
  ocppMessageReceivedTotal.add(1, {
    message_type: messageTypeId !== undefined ? MessageTypeId[messageTypeId] : UNKNOWN_ACTION,
    ocpp_version: ocppVersion,
  });
}

/** An inbound OCPP frame was successfully routed onward to the broker. */
export function recordOcppMessageRouted(action: string, ocppVersion: string): void {
  ocppMessageRoutedTotal.add(1, { action, ocpp_version: ocppVersion });
}

/**
 * A station-initiated Call was processed by the router. `errorCode` is the OCPP
 * error code, set only when `outcome` is `error`.
 */
export function recordOcppCallHandled(
  action: string,
  outcome: CallHandledOutcome,
  errorCode?: string,
): void {
  ocppCallHandledTotal.add(1, {
    action,
    outcome,
    ...(errorCode !== undefined ? { error_code: errorCode } : {}),
  });
}

/** A CSMS-initiated Call send resolved to `outcome`. */
export function recordOcppCallSent(
  action: string,
  ocppVersion: string,
  outcome: CallSentOutcome,
): void {
  ocppCallSentTotal.add(1, { action, ocpp_version: ocppVersion, outcome });
}

/** A CallResult reply send resolved to `outcome`. */
export function recordOcppCallResultSent(
  action: string,
  ocppVersion: string,
  outcome: CallResultSentOutcome,
): void {
  ocppCallResultSentTotal.add(1, { action, ocpp_version: ocppVersion, outcome });
}

/**
 * A response to a CSMS-initiated Call arrived. `errorCode` is the OCPP error
 * code, set only when `outcome` is `error`.
 */
export function recordOcppCallResponse(
  action: string,
  outcome: CallResponseOutcome,
  errorCode?: string,
): void {
  ocppCallResponseTotal.add(1, {
    action,
    outcome,
    ...(errorCode !== undefined ? { error_code: errorCode } : {}),
  });
}

/** Records the round-trip latency (seconds) of a CSMS-initiated Call, by `action`. */
export function recordOcppCallRoundtripDuration(seconds: number, action: string): void {
  ocppCallRoundtripDuration.record(seconds, { action });
}
