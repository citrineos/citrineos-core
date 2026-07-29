// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/server.ts   (integrate owner)
// buildServer(ctx): a Fastify 5 instance with the raw-preserving JSON parser,
// every OCPI module mounted through the registry+dispatcher, and the /_mock
// control API. An onSend/error safety net guarantees an Exchange still records
// if a handler throws before the dispatcher's own try/catch takes over.
// ============================================================================
import Fastify from 'fastify';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { MockContext } from './core/types.js';
import { registerAllModules } from './core/registry.js';
import { registerControlApi } from './control/controlApi.js';
import { registerDashboard } from './control/dashboard.js';

export function buildServer(ctx: MockContext): FastifyInstance {
  const app = Fastify({
    logger: { level: ctx.config.logLevel },
    // The dispatcher owns route matching for known OCPI paths; unknown paths
    // return Fastify's default 404 (fine — they were never advertised).
  });

  // Raw-preserving JSON parser: keep exact wire bytes on req.rawBody and never
  // let Fastify 400 a malformed body — the mock records + validates it itself
  // (a parse failure IS a signal we want to capture, not reject at the edge).
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req: FastifyRequest, body: string | Buffer, done) => {
      const raw = typeof body === 'string' ? body : body.toString('utf-8');
      (req as unknown as { rawBody?: string }).rawBody = raw;
      try {
        done(null, raw ? JSON.parse(raw) : undefined);
      } catch {
        // Hand the handler `undefined` body; the raw bytes are still on rawBody
        // so conformance/records see exactly what Citrine sent.
        done(null, undefined);
      }
    },
  );

  // Mount OCPI modules (versions/credentials/emsp/*) via the dispatcher, then
  // the /_mock control+inspection API (its own encapsulated plugin/prefix).
  registerAllModules(app, ctx);
  registerControlApi(app, ctx);
  // Human-facing view over the control API — served at / and /_mock/ui.
  registerDashboard(app, ctx);

  return app;
}
