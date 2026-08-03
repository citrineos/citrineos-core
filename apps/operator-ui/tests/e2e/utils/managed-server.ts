// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Builds + starts `next start` for the suite when nothing is responding on
// E2E_BASE_URL. Reuses an existing server otherwise — local `npm run dev`
// keeps working unchanged. Production-build path avoids the dev-mode OOM
// that long suites hit (dev compiles routes on demand and retains every
// artifact in memory).

const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const PID_FILE = resolve(__dirname, '..', '.next-server.pid');

function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function isServerResponding(baseUrl: string, timeoutMs = 2_000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(new URL('/login', baseUrl).toString(), {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServerReady(baseUrl: string, totalTimeoutMs: number): Promise<void> {
  const deadline = Date.now() + totalTimeoutMs;
  while (Date.now() < deadline) {
    if (await isServerResponding(baseUrl, 3_000)) return;
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error(`Managed server did not respond on ${baseUrl} within ${totalTimeoutMs}ms`);
}

function runNpmScriptToCompletion(scriptName: string): Promise<void> {
  return new Promise((res, rej) => {
    // shell:true on Windows so Node will invoke npm.cmd via the system shell.
    // Direct `.cmd` execution was disabled in Node 16+ (CVE-2024-27980 fix)
    // and otherwise errors with EINVAL.
    const proc = spawn(npmCommand(), ['run', scriptName], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        // Match the dev script's heap budget so the build doesn't OOM on
        // first-pass codegen.
        NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --max-old-space-size=4096`.trim(),
      },
    });
    proc.on('error', rej);
    proc.on('exit', (code) =>
      code === 0 ? res() : rej(new Error(`npm run ${scriptName} exited with code ${code}`)),
    );
  });
}

// Spawns `npm run start` detached so the npm process survives the
// Playwright globalSetup function returning. The PID is written to a
// sibling .next-server.pid file; globalTeardown reads it and tears the
// process tree down with taskkill /F /T (Windows) or process.kill (Unix).
function spawnDetachedServer(): number {
  const proc = spawn(npmCommand(), ['run', 'start'], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  proc.unref();
  if (!proc.pid) {
    throw new Error('Failed to spawn `npm run start` — no PID returned.');
  }
  return proc.pid;
}

// Public: ensure something is listening on E2E_BASE_URL by the time we
// return. If a server is already responding, reuse it. Otherwise build a
// production bundle and spawn `next start`, persisting the PID so
// teardown can stop it.
//
// E2E_SKIP_BUILD: CI builds operator-ui in its own workflow step right before
// the test step, so rebuilding here doubles ~1.7 min onto the critical path
// of BOTH e2e lanes. When the flag is set AND a build output exists, reuse
// it. The BUILD_ID guard keeps the flag safe locally: no artifacts, no skip.
export async function ensureManagedServer(baseUrl: string): Promise<void> {
  if (await isServerResponding(baseUrl)) {
    console.info('[e2e:managed-server] reusing existing server at', baseUrl);
    return;
  }
  const buildOutput = resolve(REPO_ROOT, '.next', 'BUILD_ID');
  if (process.env.E2E_SKIP_BUILD && existsSync(buildOutput)) {
    console.info('[e2e:managed-server] E2E_SKIP_BUILD set — reusing existing .next build.');
  } else {
    console.info('[e2e:managed-server] no server responding — building production bundle...');
    await runNpmScriptToCompletion('build');
  }
  console.info('[e2e:managed-server] starting next start...');
  const pid = spawnDetachedServer();
  writeFileSync(PID_FILE, String(pid), 'utf8');
  await waitForServerReady(baseUrl, 120_000);
  console.info(`[e2e:managed-server] production server ready (pid ${pid}) at ${baseUrl}`);
}

// Public: stop the managed server if globalSetup spawned one. No-op if
// the PID file is absent (caller reused an existing server).
export async function stopManagedServer(): Promise<void> {
  if (!existsSync(PID_FILE)) return;
  const pidStr = readFileSync(PID_FILE, 'utf8').trim();
  const pid = Number(pidStr);
  if (!pid || Number.isNaN(pid)) {
    try {
      unlinkSync(PID_FILE);
    } catch {
      /* ignore */
    }
    return;
  }
  await killProcessTree(pid);
  try {
    unlinkSync(PID_FILE);
  } catch {
    /* ignore */
  }
}

// Cross-platform process-tree kill. On Windows, `taskkill /F /T` kills the
// PID plus all descendants — necessary because `npm run start` spawns a
// `node` child that is not reachable via process.kill(pid).
function killProcessTree(pid: number): Promise<void> {
  if (process.platform === 'win32') {
    return new Promise((res) => {
      const k = spawn('taskkill', ['/F', '/T', '/PID', String(pid)], {
        stdio: 'ignore',
      });
      k.on('exit', () => res());
      k.on('error', () => res());
    });
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* already dead */
    }
  }
  return Promise.resolve();
}
