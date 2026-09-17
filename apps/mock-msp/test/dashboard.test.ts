// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The static dashboard routes (/, /_mock/ui, /_mock/ui2) and the missing-file fallback.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import { makeServer } from './harness.js';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public');

describe('dashboard routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ app } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  for (const url of ['/', '/_mock/ui']) {
    it(`GET ${url} serves the dashboard page`, async () => {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/^text\/html/);
      expect(res.body).toContain('id="covGrid"');
      expect(res.body).toContain('setInterval(refresh, 2000)');
      expect(res.body).toBe(readFileSync(resolve(publicDir, 'dashboard.html'), 'utf-8'));
    });
  }

  it('GET /_mock/ui2 serves the redesign preview when dashboard.next.html exists', async () => {
    const res = await app.inject({ method: 'GET', url: '/_mock/ui2' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/^text\/html/);
    expect(res.body).toContain('<script');
    expect(res.body).toBe(readFileSync(resolve(publicDir, 'dashboard.next.html'), 'utf-8'));
  });

  it('dashboard is served with the control secret enabled (not behind the /_mock guard)', async () => {
    await app.close();
    ({ app } = makeServer({ controlSecret: 'shh' }));
    await app.ready();
    const root = await app.inject({ method: 'GET', url: '/' });
    expect(root.statusCode).toBe(200);
    expect(root.body).toContain('id="covGrid"');
    // /_mock/ui is registered outside the encapsulated control plugin, so the
    // preHandler guard does not apply to it either.
    const ui = await app.inject({ method: 'GET', url: '/_mock/ui' });
    expect(ui.statusCode).toBe(200);
  });
});

describe('dashboard fallback when the html files are missing', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.doUnmock('node:fs');
    vi.resetModules();
  });

  it('serves an inline placeholder page at / and drops /_mock/ui2', async () => {
    vi.doMock('node:fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:fs')>();
      return {
        ...actual,
        readFileSync: ((path: unknown, ...rest: unknown[]) => {
          if (/dashboard(\.next)?\.html$/.test(String(path))) {
            throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
          }
          return (actual.readFileSync as (...a: unknown[]) => unknown)(path, ...rest);
        }) as typeof actual.readFileSync,
      };
    });
    vi.resetModules();
    const { registerDashboard } = await import('../src/control/dashboard.js');

    app = Fastify({ logger: false });
    registerDashboard(app, {} as never);
    await app.ready();

    const root = await app.inject({ method: 'GET', url: '/' });
    expect(root.statusCode).toBe(200);
    expect(root.headers['content-type']).toMatch(/^text\/html/);
    expect(root.body).toContain('dashboard.html was not found');
    expect(root.body).toContain('/_mock');
    expect(root.body).not.toContain('id="covGrid"');

    const ui = await app.inject({ method: 'GET', url: '/_mock/ui' });
    expect(ui.body).toBe(root.body);

    const ui2 = await app.inject({ method: 'GET', url: '/_mock/ui2' });
    expect(ui2.statusCode).toBe(404);
  });
});
