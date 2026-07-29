// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/modules/commands.ts
// ----------------------------------------------------------------------------
// Module "commands" — the eMSP SENDER side of OCPI 2.2.1 Commands.
//
// Two halves of the command flow, split across two builders per the frozen spec:
//   1. SEND (outbound): WE (eMSP) POST a command
//      (START_SESSION/STOP_SESSION/RESERVE_NOW/CANCEL_RESERVATION/UNLOCK_CONNECTOR)
//      to Citrine's CPO commands receiver with a `response_url` pointing back at
//      the receiver hosted below. That outbound call lives in OcpiClient.sendCommand
//      (src/core/client.ts, middleware owner) and is triggered via /_mock/commands/:type.
//      It records a PendingCommand in store.domain.commands keyed to the uid it mints
//      into the response_url, and exposes awaitResult() = store.waitForReceived on that url.
//   2. RECEIVE (inbound, THIS file): Citrine later POSTs the async CommandResult to the
//      exact response_url we advertised. We host that here at
//      POST /ocpi/2.2.1/emsp/commands/:command/:uid, correlate it back to the
//      PendingCommand, and reply with an empty OCPI envelope.
//
// recon #1 (candidate Citrine bug): Citrine sends this async callback with the
// OCPI-from / OCPI-to routing headers REVERSED (from=eMSP US/TST, to=CPO). Therefore
// this route uses auth:'callback' with requireRoutingHeaders:false so the dispatcher
// does NOT strict-validate routing headers — otherwise a valid Citrine callback would
// be rejected. Token auth still applies (callback mode requires tokenWeAccept).
//
// Validation: the inbound body is validated against ocpi-base CommandResultSchema
// (drift => Finding, recorded by the dispatcher). The sync CommandResponse Citrine
// returns to our SEND is validated by OcpiClient (CommandResponseSchema) on the
// outbound side — not here. Our own reply is the empty envelope (OcpiEmptyResponseSchema).
//
// This file only EXPORTS a ModuleDef; the integrator plugs it into the registry via
// src/modules/index.ts. Handlers are pure (ctx) => OcpiReply — they never touch the
// Fastify request/reply, never set wire status codes, never build the envelope, and
// never check auth/routing headers (the dispatcher owns all of that).
// ============================================================================

import {
  CommandResultSchema,
  OcpiEmptyResponseSchema,
  ModuleId,
  CommandType,
} from '../ocpi/barrel.js';
import type {
  ModuleDef,
  OcpiRoute,
  MockContext,
  OcpiReply,
  PendingCommand,
} from '../core/types.js';

// Absolute mount for the eMSP commands receiver (matches the endpoint catalog +
// the response_url shape the actor advertises to Citrine).
export const COMMANDS_MOUNT = '/ocpi/2.2.1/emsp/commands';

// The response_url the actor advertises for a given command send, kept here so the
// SEND side (OcpiClient.sendCommand) and this RECEIVE side agree on one URL shape.
// `publicBaseUrl` already includes the '/ocpi' prefix (e.g. host.docker.internal:8083/ocpi).
export function commandResponseUrl(
  publicBaseUrl: string,
  type: CommandType | string,
  uid: string,
): string {
  return `${publicBaseUrl}/2.2.1/emsp/commands/${type}/${uid}`;
}

// Correlate an inbound async result back to the PendingCommand recorded at SEND time.
// Defensive against however the middleware keys the domain.commands Map: try the uid as
// key first, then fall back to scanning by commandId / response_url suffix.
function findPendingCommand(
  ctx: MockContext,
  command: string,
  uid: string,
): PendingCommand | undefined {
  const byKey = ctx.store.domain.commands.get(uid);
  if (byKey) return byKey;
  const suffix = `/${command}/${uid}`;
  for (const pending of ctx.store.domain.commands.values()) {
    if (pending.commandId === uid || pending.responseUrl.endsWith(suffix)) return pending;
  }
  return undefined;
}

// ---- Async CommandResult receiver ------------------------------------------
// POST /ocpi/2.2.1/emsp/commands/:command/:uid  (the response_url we advertised)
// Body: CommandResult { result: CommandResultType, message?: DisplayText }.
// The result is captured verbatim in the recorded Exchange (the dispatcher records the
// inbound request body), which is exactly what wakes any awaitResult() waiter registered
// via store.waitForReceived on this url. We correlate for flow-stitching + observability,
// then reply with an empty envelope.
function handleCommandResult(ctx: MockContext): OcpiReply {
  const params = ctx.req?.params ?? {};
  const command = params.command ?? '';
  const uid = params.uid ?? '';

  const pending = findPendingCommand(ctx, command, uid);

  if (pending) {
    // Stitch this callback's Exchange to the original SEND via the command id, so the
    // recorder's flow chain links "command POST" -> "async result callback".
    if (ctx.event) ctx.event.flowId = pending.commandId;
  } else {
    // A result callback we can't trace to a tracked send (late/duplicate/externally
    // triggered command, or a fresh mock instance). Record as info — not an error —
    // so it is visible in /_mock/findings without polluting the error surface.
    ctx.store.addFinding({
      severity: 'info',
      kind: 'body',
      module: ModuleId.Commands,
      seq: ctx.event?.seq ?? 0,
      detail: `Received CommandResult for ${command || '<unknown>'}/${uid || '<unknown>'} with no matching PendingCommand`,
    });
  }

  // Empty envelope (data OMITTED). OcpiEmptyResponseSchema is z.undefined() — never
  // return data:{} or data:null here or Citrine's schema.parse would throw.
  return ctx.empty();
}

const commandResultRoute: OcpiRoute = {
  module: ModuleId.Commands,
  method: 'POST',
  path: '/:command/:uid',
  operation: 'commands.result',
  auth: 'callback', // token required; routing headers NOT strict-validated (recon #1: Citrine reverses from/to)
  requireRoutingHeaders: false,
  requestSchema: CommandResultSchema, // ocpi-base — validates Citrine's async CommandResult body
  responseSchema: OcpiEmptyResponseSchema, // ocpi-base — our empty-envelope reply self-check + fault target
  handle: handleCommandResult,
};

export const commandsModule: ModuleDef = {
  id: ModuleId.Commands,
  mount: COMMANDS_MOUNT,
  routes: [commandResultRoute],
};
