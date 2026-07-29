// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/context.ts   (integrate owner)
// buildContext(cfg): assemble the shared singletons (WireLogger, Store,
// FaultEngine, OcpiClient) + identity + envelope helpers into one MockContext.
// The dispatcher shallow-clones this per request and fills req/route/event/etc;
// at singleton scope those per-request fields are undefined.
// ============================================================================
import type { MockConfig, MockContext } from './core/types.js';
import { buildIdentity } from './identity.js';
import { createStore } from './core/Store.js';
import { createFaultEngine } from './core/faults.js';
import { createWireLogger } from './core/wireLog.js';
import { createOcpiClient } from './core/client.js';
import { ok, empty, error } from './core/envelope.js';

export function buildContext(config: MockConfig): MockContext {
  const identity = buildIdentity(config);

  // Order matters: the client needs store + faults + log.
  const log = createWireLogger({
    pretty: true,
    ndjson: process.env.MOCK_MSP_NDJSON === '1',
    bindings: { party: `${config.countryCode}/${config.partyId}` },
  });
  const store = createStore(config);
  const faults = createFaultEngine();
  const client = createOcpiClient({ config, identity, store, faults, log });

  return {
    config,
    identity,
    store,
    faults,
    client,
    log,
    // Envelope helpers bound at singleton scope; the dispatcher re-binds the same
    // functions per request so control-API handlers can also call ctx.ok/etc.
    ok,
    empty,
    error,
  };
}
