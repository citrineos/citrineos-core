// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Boots the built entrypoint (dist/index.js) as a child process: scenario
// loading, listen, optional auto-registration, and the failure exits.
import { afterEach, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import net, { type AddressInfo } from 'node:net';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  startStubCpo,
  cpoVersionsPayloads,
  cpoCredentials,
  ocpiEnvelope,
  type StubCpo,
} from './harness.js';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = resolve(appDir, 'dist/index.js');
// Cold node start of dist/ plus its deps can take a while on a loaded box.
const TEST_TIMEOUT = 60_000;
const BOOT_TIMEOUT = 50_000;

async function freePort(): Promise<number> {
  const srv = net.createServer();
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
  const { port } = srv.address() as AddressInfo;
  await new Promise<void>((r) => srv.close(() => r()));
  return port;
}

interface Child {
  proc: ChildProcess;
  stderr: () => string;
  exit: Promise<number | null>;
  kill: () => Promise<void>;
}

function boot(env: Record<string, string>, port: number): Child {
  const proc = spawn(process.execPath, [entry], {
    cwd: appDir,
    env: {
      ...process.env,
      MOCK_MSP_HOST: '127.0.0.1',
      MOCK_MSP_PORT: String(port),
      MOCK_MSP_LOG_LEVEL: 'silent',
      MOCK_MSP_PUBLIC_BASE_URL: `http://127.0.0.1:${port}/ocpi`,
      ...env,
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  proc.stderr?.on('data', (c: Buffer) => {
    stderr += c.toString('utf-8');
  });
  const exit = new Promise<number | null>((r) => proc.on('exit', (code) => r(code)));
  return {
    proc,
    stderr: () => stderr,
    exit,
    kill: async () => {
      if (proc.exitCode === null && !proc.killed) proc.kill();
      await exit;
    },
  };
}

async function health(port: number): Promise<Record<string, unknown> | undefined> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/_mock/health`);
    if (!res.ok) return undefined;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

async function waitFor<T>(
  probe: () => Promise<T | undefined>,
  child: Child,
  timeoutMs = BOOT_TIMEOUT,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.proc.exitCode !== null) {
      throw new Error(`child exited early (${child.proc.exitCode}): ${child.stderr()}`);
    }
    const v = await probe();
    if (v !== undefined) return v;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`timed out waiting; stderr: ${child.stderr()}`);
}

describe('dist/index.js entrypoint', () => {
  let child: Child | undefined;
  let cpo: StubCpo | undefined;
  let blocker: net.Server | undefined;

  afterEach(async () => {
    await child?.kill();
    child = undefined;
    await cpo?.close();
    cpo = undefined;
    if (blocker) await new Promise<void>((r) => blocker!.close(() => r()));
    blocker = undefined;
  });

  it('the built entrypoint exists', () => {
    expect(existsSync(entry)).toBe(true);
  });

  it(
    'exits 1 when the scenario file cannot be loaded',
    async () => {
      const port = await freePort();
      child = boot({ MOCK_MSP_SCENARIO: 'scenarios/does-not-exist.json' }, port);
      const code = await child.exit;
      expect(code).toBe(1);
      expect(child.stderr()).toContain('failed to load scenario');
      expect(await health(port)).toBeUndefined();
    },
    TEST_TIMEOUT,
  );

  it(
    'boots a preregistered scenario and answers /_mock/health',
    async () => {
      const port = await freePort();
      child = boot({ MOCK_MSP_SCENARIO: 'scenarios/preregistered.json' }, port);
      const h = await waitFor(() => health(port), child);
      expect(h.status).toBe('up');
      expect(h.scenario).toBe('preregistered');
      expect((h.registration as { status: string }).status).toBe('registered');
      expect(child.proc.exitCode).toBeNull();
    },
    TEST_TIMEOUT,
  );

  it(
    'MOCK_MSP_AUTO_REGISTER=1 runs the msp-initiated handshake against the CPO',
    async () => {
      cpo = await startStubCpo((req, stub) => {
        const payloads = cpoVersionsPayloads(stub.baseUrl);
        if (req.method === 'POST' && req.path.endsWith('/generate-credentials-token-a')) {
          return {
            json: ocpiEnvelope(cpoCredentials(`${stub.baseUrl}/versions`, 'TOKEN-A-FROM-CPO')),
          };
        }
        if (req.method === 'GET' && req.path === '/ocpi/versions') return { json: payloads.list };
        if (req.method === 'GET' && req.path === '/ocpi/versions/2.2.1') {
          return { json: payloads.details };
        }
        if (req.method === 'POST' && req.path === '/ocpi/2.2.1/credentials') {
          return { json: ocpiEnvelope(cpoCredentials(`${stub.baseUrl}/versions`, 'TOKEN-C')) };
        }
        return undefined;
      });
      const port = await freePort();
      child = boot(
        {
          MOCK_MSP_SCENARIO: 'scenarios/unregistered.json',
          MOCK_MSP_AUTO_REGISTER: '1',
          CITRINE_OCPI_BASE_URL: cpo.baseUrl,
        },
        port,
      );

      const h = await waitFor(async () => {
        const cur = await health(port);
        return (cur?.registration as { status: string } | undefined)?.status === 'registered'
          ? cur
          : undefined;
      }, child);
      expect(h.scenario).toBe('unregistered');

      const paths = cpo.requests.map((r) => `${r.method} ${r.path}`);
      expect(paths).toContain('POST /ocpi/2.2.1/credentials/generate-credentials-token-a');
      expect(paths).toContain('GET /ocpi/versions');
      expect(paths).toContain('GET /ocpi/versions/2.2.1');
      expect(paths).toContain('POST /ocpi/2.2.1/credentials');
      const post = cpo.requests.find((r) => r.method === 'POST' && r.path.endsWith('/credentials'));
      expect((post!.body as { url: string }).url).toBe(`http://127.0.0.1:${port}/ocpi/versions`);

      const reg = (await (await fetch(`http://127.0.0.1:${port}/_mock/registration`)).json()) as {
        tokenWePresent: string;
        tokenA?: string;
      };
      expect(reg.tokenWePresent).toBe('TOKEN-C');
      expect(reg.tokenA).toBeUndefined();
    },
    TEST_TIMEOUT,
  );

  it(
    'stays up (unregistered) when auto-registration cannot reach the CPO',
    async () => {
      const port = await freePort();
      child = boot(
        {
          MOCK_MSP_SCENARIO: 'scenarios/unregistered.json',
          MOCK_MSP_AUTO_REGISTER: '1',
          CITRINE_OCPI_BASE_URL: 'http://127.0.0.1:1/ocpi',
        },
        port,
      );
      const h = await waitFor(() => health(port), child);
      expect((h.registration as { status: string }).status).toBe('unregistered');

      // The failed outbound call is recorded (httpStatus 0), not swallowed...
      const failed = await waitFor(async () => {
        const res = await fetch(`http://127.0.0.1:${port}/_mock/exchanges?direction=outbound`);
        const list = (await res.json()) as Array<{
          operation: string;
          response: { httpStatus: number };
        }>;
        return list.find((e) => e.operation === 'credentials.generate-token-a');
      }, child);
      expect(failed.response.httpStatus).toBe(0);

      // ...and the process is still serving, still unregistered.
      await new Promise((r) => setTimeout(r, 200));
      expect(child.proc.exitCode).toBeNull();
      const again = await health(port);
      expect((again?.registration as { status: string }).status).toBe('unregistered');
    },
    TEST_TIMEOUT,
  );

  it(
    'exits 1 when the port is already taken',
    async () => {
      blocker = net.createServer();
      await new Promise<void>((r) => blocker!.listen(0, '127.0.0.1', r));
      const { port } = blocker.address() as AddressInfo;
      child = boot({}, port);
      const code = await child.exit;
      expect(code).toBe(1);
      expect(child.stderr()).toMatch(/EADDRINUSE|failed to start/);
    },
    TEST_TIMEOUT,
  );
});
