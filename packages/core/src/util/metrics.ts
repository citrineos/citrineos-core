// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP transport & message-flow metrics.
 *
 * These instruments feed whatever global OpenTelemetry MeterProvider is
 * registered in the process.
 */

import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('citrineos.ocpp');

// --- WebSocket connection lifecycle ------------------------------------------

/**
 * Upgrade/authentication outcomes. `result` is the earliest decision point:
 * upgraded | auth_failed | broker_unavailable | tenant_unresolved | internal_error.
 */
export const wsUpgradeTotal = meter.createCounter('ocpp_ws_upgrade_total', {
  description: 'WebSocket upgrade/authentication attempts, by result',
});

/**
 * Connections that completed the FULL registration path (auth -> station check
 * -> tenant limit -> cache slot claim -> router register -> broker subscribe).
 */
export const wsConnectionEstablishedTotal = meter.createCounter(
  'ocpp_ws_connection_established_total',
  { description: 'WebSocket connections that completed full registration' },
);

/**
 * Connections rejected AFTER a successful upgrade, by `reason`:
 * no_protocol | unknown_station | tenant_limit | slot_taken | register_failed |
 * connection_failed. Splitting these tells you which stage regressed.
 */
export const wsConnectionRejectedTotal = meter.createCounter('ocpp_ws_connection_rejected_total', {
  description: 'Connections rejected after upgrade, by reason',
});

/** Time from the `connection` event to full registration ("all the way"). */
export const wsConnectionSetupDuration = meter.createHistogram(
  'ocpp_ws_connection_setup_duration_seconds',
  { description: 'Time from connection event to full registration', unit: 's' },
);

/** Closes by WebSocket close `code` (1000/1001 normal, 1006/1011/1013 abnormal). */
export const wsConnectionClosedTotal = meter.createCounter('ocpp_ws_connection_closed_total', {
  description: 'WebSocket connections closed, by close code',
});

/** Currently-active connections (source of truth: _identifierConnections). */
export const wsActiveConnections = meter.createUpDownCounter('ocpp_ws_active_connections', {
  description: 'Currently active WebSocket connections',
});

/** Failures sending to a station, by `reason`: no_cache | no_socket | not_open | send_error. */
export const wsSendFailureTotal = meter.createCounter('ocpp_ws_send_failure_total', {
  description: 'Failures sending a message to a charging station, by reason',
});

// --- OCPP message flow -------------------------------------------------------

/** Every inbound OCPP frame, by `message_type` (Call|CallResult|CallError) and `ocpp_version`. */
export const ocppMessageReceivedTotal = meter.createCounter('ocpp_message_received_total', {
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
export const ocppMessageRoutedTotal = meter.createCounter('ocpp_message_routed_total', {
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
export const ocppCallHandledTotal = meter.createCounter('ocpp_call_handled_total', {
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
export const ocppCallSentTotal = meter.createCounter('ocpp_call_sent_total', {
  description: 'CSMS-initiated Calls sent to stations, by action, OCPP version and outcome',
});

/**
 * CallResult replies the CSMS sends back to stations for station-initiated
 * Calls, by `action`, `ocpp_version` and `outcome`
 * (sent | send_failed | no_pending_request | action_mismatch). This is the real
 * "CSMS replied with a CallResult" event (distinct from `ocppCallHandledTotal`,
 * which only marks that the inbound Call was routed for handling).
 */
export const ocppCallResultSentTotal = meter.createCounter('ocpp_call_result_sent_total', {
  description: 'CallResult replies sent to stations, by action, OCPP version and outcome',
});

/**
 * Responses to CSMS-initiated Calls, by `action` and `outcome`
 * (result | error | orphan_or_timeout), plus `error_code` on CallError.
 * `orphan_or_timeout` = a response arrived with no pending request cached
 * (a strong "call timed out" proxy).
 */
export const ocppCallResponseTotal = meter.createCounter('ocpp_call_response_total', {
  description: 'Responses to CSMS-initiated Calls, by action and outcome',
});

/** Round-trip latency for CSMS-initiated Calls, by `action`. */
export const ocppCallRoundtripDuration = meter.createHistogram(
  'ocpp_call_roundtrip_duration_seconds',
  { description: 'Round-trip latency for CSMS-initiated Calls', unit: 's' },
);
