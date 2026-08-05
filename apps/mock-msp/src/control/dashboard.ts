// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// ----------------------------------------------------------------------------
// Serves the self-contained mock-msp dashboard (a single static HTML page) at
// GET / and GET /_mock/ui. The page is a pure VIEW: it talks to the existing
// /_mock control API over same-origin fetch and adds zero new server state.
//
// The HTML lives at <package>/public/dashboard.html. import.meta.url resolves to
// src/control/dashboard.ts in dev (tsx) and dist/control/dashboard.js in prod
// (node) — '../../public/dashboard.html' lands on the package-root public/ in
// BOTH layouts, so no build-time copy step is needed.
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { MockContext } from '../core/types.js';

const HTML_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/dashboard.html');
// The redesign under construction. Served at /_mock/ui2 while / keeps the proven
// dashboard untouched; at cutover this file becomes dashboard.html and this route
// is removed. Optional — if the file is absent (e.g. after cutover), /ui2 404s.
const NEXT_HTML_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../public/dashboard.next.html',
);

function loadFile(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

function loadHtml(): string {
  try {
    return readFileSync(HTML_PATH, 'utf-8');
  } catch {
    return (
      '<!doctype html><meta charset="utf-8"><title>mock-msp</title>' +
      '<body style="font-family:sans-serif;padding:2rem;background:#0d1117;color:#e6edf3">' +
      '<h1>mock-msp</h1><p>dashboard.html was not found at <code>' +
      HTML_PATH +
      '</code>. The control API is still fully available under <code>/_mock</code>.</p>'
    );
  }
}

export function registerDashboard(app: FastifyInstance, _ctx: MockContext): void {
  // Static page, read once at boot.
  const html = loadHtml();
  const serve = async (_req: unknown, reply: FastifyReply): Promise<FastifyReply> =>
    reply.type('text/html; charset=utf-8').send(html);
  app.get('/', serve);
  app.get('/_mock/ui', serve);

  // Redesign preview (only if the file exists — removed at cutover).
  const nextHtml = loadFile(NEXT_HTML_PATH);
  if (nextHtml) {
    app.get('/_mock/ui2', async (_req, reply: FastifyReply) =>
      reply.type('text/html; charset=utf-8').send(nextHtml),
    );
  }
}
