// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
//
// Launcher for the CitrineOS docker stack. Translates a few friendly flags into
// the right `docker compose` files and profiles, so contributors don't have to
// remember the file/profile matrix.
//
//   node scripts/stack.mjs                 ocpp-server + operator UI, ghcr.io images
//   node scripts/stack.mjs --local         build server + UI from local source
//   node scripts/stack.mjs --solo          ocpp-server only (no UI)
//   node scripts/stack.mjs --ocpi          add the OCPI server
//   node scripts/stack.mjs --payment       add the payment server and its driver pages, always built from local
//                                          source (Stripe keys in apps/payment/.env.local)
//   node scripts/stack.mjs --everest       add EVerest with OCPP 2.x
//   node scripts/stack.mjs --everest16     add EVerest with OCPP 1.6
//   node scripts/stack.mjs --local --ocpi  combine flags freely
//   node scripts/stack.mjs down            stop the stack (pass the same flags you brought it up with)
//
// Image is the default because most local-build issues come from stale source;
// reach for --local when you're working on the code itself.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// To help support running on Windows
const useShell = process.platform === 'win32';

function run(command, args) {
  return spawnSync(command, args, { stdio: 'inherit', cwd: repoRoot, shell: useShell });
}

const KNOWN_FLAGS = new Set([
  '--local',
  '--solo',
  '--ocpi',
  '--payment',
  '--everest',
  '--everest16',
  '--help',
  '-h',
]);
const KNOWN_COMMANDS = new Set(['up', 'down']);

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('-')));
const positionals = argv.filter((a) => !a.startsWith('-'));

function usage() {
  console.log(`Usage: node scripts/stack.mjs [up|down] [--local] [--solo] [--ocpi] [--payment] [--everest] [--everest16]

  (no flags)   ocpp-server + operator UI using ghcr.io images
  --local      build the server and UI from local source instead of pulling
  --solo       ocpp-server only (no operator UI)
  --ocpi       also run the OCPI server
  --payment    also run the payment server and its driver pages on port 9010, built from local source;
               put your Stripe keys in apps/payment/.env.local
  --everest    also run EVerest with OCPP 2.x (mutually exclusive with --everest16)
  --everest16  also run EVerest with OCPP 1.6 (mutually exclusive with --everest)
  up | down    start (default) or stop the stack — pass the same flags both times
`);
}

if (flags.has('--help') || flags.has('-h')) {
  usage();
  process.exit(0);
}

const unknownFlags = [...flags].filter((f) => !KNOWN_FLAGS.has(f));
const unknownCommands = positionals.filter((p) => !KNOWN_COMMANDS.has(p));
if (unknownFlags.length || unknownCommands.length || positionals.length > 1) {
  if (unknownFlags.length) console.error(`Unknown flag(s): ${unknownFlags.join(', ')}`);
  if (unknownCommands.length) console.error(`Unknown command(s): ${unknownCommands.join(', ')}`);
  if (positionals.length > 1) console.error('Only one command (up or down) is allowed.');
  usage();
  process.exit(1);
}

const command = positionals[0] ?? 'up';
const local = flags.has('--local');
const solo = flags.has('--solo');
const ocpi = flags.has('--ocpi');
const payment = flags.has('--payment');
const everest = flags.has('--everest');
const everest16 = flags.has('--everest16');

if (solo && ocpi) {
  console.error('Error: --solo (server only) and --ocpi (add OCPI) are mutually exclusive.');
  process.exit(1);
}

if (everest && everest16) {
  console.error(
    'Error: --everest (EVerest 2.x) and --everest16 (EVerest 1.6) are mutually exclusive.',
  );
  process.exit(1);
}

// The payment server will not start without Stripe keys; say so before compose does.
if (payment && command === 'up') {
  const secrets = resolve(repoRoot, 'apps/payment/.env.local');
  const configured = existsSync(secrets) ? readFileSync(secrets, 'utf8') : '';
  const missing = ['STRIPE_API_KEY', 'STRIPE_CONNECT_WEBHOOK_SECRET'].filter(
    (name) => !new RegExp(`^${name}=(?!\\s*$|.*\\.\\.\\.)`, 'm').test(configured),
  );
  if (missing.length) {
    console.warn(
      `Warning: ${missing.join(' and ')} not set in apps/payment/.env.local ` +
        '(see apps/payment/.env.local.example); the payment server will not start without them.',
    );
  }
}

// Build the file list: base always, local override only with --local.
const files = ['-f', 'docker-compose.yml'];
if (local) files.push('-f', 'docker-compose.local.yml');

// Build the profile list: UI on by default (off with --solo), OCPI on with --ocpi.
const profiles = [];
if (!solo) profiles.push('ui');
if (ocpi) profiles.push('ocpi');
if (payment) profiles.push('payment');
const profileArgs = profiles.flatMap((p) => ['--profile', p]);

// The operator UI reaches the payment app's API by its service name, and browsers its driver pages
// on the published port (docker-compose.yml passes these to citrine-ui).
if (payment) {
  process.env.CITRINE_UI_PAYMENT_URL = 'http://citrineos-payment:9010';
  process.env.CITRINE_UI_PAYMENT_PUBLIC_URL = 'http://localhost:9010';
}

const composeArgs = ['compose', ...files, ...profileArgs];
if (command === 'down') {
  composeArgs.push('down');
} else {
  composeArgs.push('up', '-d');
  // Force a rebuild when running from local source so edits are picked up.
  if (local) composeArgs.push('--build');
}

console.log(`> docker ${composeArgs.join(' ')}`);
const result = run('docker', composeArgs);

if (result.error) {
  console.error(`Failed to run docker: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

const everestPnpmScript =
  command === 'down' && (everest || everest16)
    ? 'stop:everest'
    : everest16
      ? 'start:everest:16'
      : everest
        ? 'start:everest'
        : null;

if (everestPnpmScript) {
  console.log(`> pnpm ${everestPnpmScript}`);
  const everestResult = run('pnpm', [everestPnpmScript]);
  if (everestResult.error) {
    console.error(`Failed to start EVerest: ${everestResult.error.message}`);
    process.exit(1);
  }
  process.exit(everestResult.status ?? 1);
}

process.exit(0);
