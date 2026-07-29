// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/core/registry.ts   (integrate owner)
// Binds every ModuleDef route onto the Fastify app through the dispatcher.
// The dispatcher (ocpi/dispatcher.ts) owns the whole per-request pipeline and
// sends the reply itself; the Fastify handler here is a thin closure that hands
// (route, ctx, freq, freply) to dispatch() and never touches reply directly.
// ============================================================================
import type { FastifyInstance } from 'fastify';
import type { MockContext, ModuleDef } from './types.js';
import { dispatch } from '../ocpi/dispatcher.js';
import { allModules } from '../modules/index.js';

export function registerModule(app: FastifyInstance, def: ModuleDef, ctx: MockContext): void {
  for (const route of def.routes) {
    const url = def.mount + route.path;
    app.route({
      method: route.method,
      url,
      // dispatch() drives auth -> routing -> record -> validate -> handle ->
      // self-check -> fault -> send. It calls freply.send itself, so this
      // handler returns nothing and must not also send.
      handler: (freq, freply) => dispatch(route, ctx, freq, freply),
    });
  }
}

export function registerAllModules(app: FastifyInstance, ctx: MockContext): void {
  for (const def of allModules) registerModule(app, def, ctx);
}
