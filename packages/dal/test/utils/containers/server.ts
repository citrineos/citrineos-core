import { fileURLToPath } from 'url';
import { type ChildProcess, spawn } from 'child_process';

const SERVER_DIST = fileURLToPath(
  new URL('../../../../../../apps/ocpp-server/dist/index.js', import.meta.url),
);

const HTTP_PORT = 8080; // Fastify API + /health endpoint

export async function spawnServer(
  env: NodeJS.ProcessEnv,
  label: string,
  timeoutMs = 45_000,
): Promise<ChildProcess> {
  const server = spawn('node', [SERVER_DIST], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Surface server output so failures are debuggable without digging into logs.
  server.stdout?.on('data', (c: Buffer) => process.stdout.write(`[server:${label}] ${c}`));
  server.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[server:${label}] ${chunk}`);
  });

  await waitForHealth(timeoutMs);

  return server;
}

export async function killServer(proc: ChildProcess): Promise<void> {
  if (proc.exitCode !== null || proc.signalCode !== null) return;
  const exited = new Promise<void>((resolve) => proc.once('exit', () => resolve()));
  proc.kill('SIGTERM');
  const timeout = new Promise<void>((resolve) =>
    setTimeout(() => {
      if (proc.exitCode === null && proc.signalCode === null) proc.kill('SIGKILL');
      resolve();
    }, 10_000),
  );
  await Promise.race([exited, timeout]);
  await exited; // ensure we don't return until the OS has reaped the process
}

export async function waitForHealth(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${HTTP_PORT}/health/ready`);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become healthy within ${timeoutMs}ms`);
}
