// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
//
// ----------------------------------------------------------------------------
// One-command OCPI credentials handshake helper for @citrineos/mock-msp.
//
// This does NOT talk to Citrine directly; it drives the mock's own Actor
// (OcpiClient) through the /_mock control API, so all the wire mechanics
// (base64 Token auth, X-Request-ID/X-Correlation-ID, version discovery,
// generate-credentials-token-a, POST /credentials) are handled by the mock and
// recorded in its trace. The mock must already be running (default :8083).
//
// Usage (run with tsx — no build step required):
//
//   npx tsx apps/mock-msp/scripts/register.ts                 # register, msp-initiated (default)
//   npx tsx apps/mock-msp/scripts/register.ts msp-initiated   # explicit
//   npx tsx apps/mock-msp/scripts/register.ts cpo-initiated   # let Citrine drive the handshake
//   npx tsx apps/mock-msp/scripts/register.ts reregister      # PUT re-registration
//   npx tsx apps/mock-msp/scripts/register.ts unregister      # DELETE credentials + wipe tokens
//
// Or, with no tooling at all, the equivalent bare curl:
//
//   curl -X POST 'http://localhost:8083/_mock/register?mode=msp-initiated'
//
// Environment:
//   MOCK_MSP_CONTROL_BASE   base URL of the mock control API (default derived
//                           from MOCK_MSP_PORT, i.e. http://localhost:8083)
//   MOCK_MSP_PORT           used only to derive the default control base (8083)
//   MOCK_MSP_CONTROL_SECRET if the mock was started with a control secret, it is
//                           sent as the `x-mock-control-secret` header
//
// NOTE on the seeded state: Citrine ships already knowing this partner
// (preregistered), and Citrine's admin `generate-credentials-token-a` refuses a
// partner that already has an OCPI profile. So the msp-initiated flow is meant
// for a FRESH/unregistered Citrine partner. For the default seeded stack you do
// not need to register at all — the bootstrap tokens already work.
// ----------------------------------------------------------------------------

type Action = 'register' | 'reregister' | 'unregister';
type RegisterMode = 'msp-initiated' | 'cpo-initiated';

interface Parsed {
  action: Action;
  mode: RegisterMode;
}

function parseArgs(argv: string[]): Parsed {
  const arg = (argv[2] ?? '').trim();
  if (arg === 'unregister') return { action: 'unregister', mode: 'msp-initiated' };
  if (arg === 'reregister') return { action: 'reregister', mode: 'msp-initiated' };
  if (arg === 'cpo-initiated') return { action: 'register', mode: 'cpo-initiated' };
  if (arg === '' || arg === 'register' || arg === 'msp-initiated') {
    return { action: 'register', mode: 'msp-initiated' };
  }
  console.error(
    `Unknown argument "${arg}". Use one of: register | msp-initiated | cpo-initiated | reregister | unregister`,
  );
  process.exit(2);
}

function controlBase(): string {
  const explicit = process.env.MOCK_MSP_CONTROL_BASE;
  if (explicit && explicit.length > 0) return explicit.replace(/\/$/, '');
  const port = process.env.MOCK_MSP_PORT ?? '8083';
  return `http://localhost:${port}`;
}

function endpointFor(base: string, { action, mode }: Parsed): string {
  switch (action) {
    case 'register':
      return `${base}/_mock/register?mode=${encodeURIComponent(mode)}`;
    case 'reregister':
      return `${base}/_mock/reregister`;
    case 'unregister':
      return `${base}/_mock/unregister`;
  }
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);
  const base = controlBase();
  const url = endpointFor(base, parsed);

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const secret = process.env.MOCK_MSP_CONTROL_SECRET;
  if (secret && secret.length > 0) headers['x-mock-control-secret'] = secret;

  console.log(`> POST ${url}`);

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers });
  } catch (err) {
    console.error(
      `\nCould not reach the mock control API at ${base}.\n` +
        `Is the mock running? Start it with:  pnpm --filter @citrineos/mock-msp dev\n` +
        `Underlying error: ${(err as Error).message}`,
    );
    process.exit(1);
    return;
  }

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    // leave body as raw text
  }

  console.log(`< HTTP ${res.status} ${res.statusText}`);
  console.log(typeof body === 'string' ? body : JSON.stringify(body, null, 2));

  if (!res.ok) {
    console.error(`\n${parsed.action} failed (HTTP ${res.status}).`);
    process.exit(1);
  }

  console.log(`\n${parsed.action} OK.`);
}

try {
  await main();
} catch (err) {
  console.error('register script failed:', err);
  process.exit(1);
}
