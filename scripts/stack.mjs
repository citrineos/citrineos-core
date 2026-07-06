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
//   node scripts/stack.mjs --local --ocpi  combine flags freely
//   node scripts/stack.mjs down            stop the stack (pass the same flags you brought it up with)
//
// Image is the default because most local-build issues come from stale source;
// reach for --local when you're working on the code itself.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const KNOWN_FLAGS = new Set(['--local', '--solo', '--ocpi', '--help', '-h']);
const KNOWN_COMMANDS = new Set(['up', 'down']);

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('-')));
const positionals = argv.filter((a) => !a.startsWith('-'));

function usage() {
  console.log(`Usage: node scripts/stack.mjs [up|down] [--local] [--solo] [--ocpi]

  (no flags)   ocpp-server + operator UI using ghcr.io images
  --local      build the server and UI from local source instead of pulling
  --solo       ocpp-server only (no operator UI)
  --ocpi       also run the OCPI server
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

if (solo && ocpi) {
  console.error('Error: --solo (server only) and --ocpi (add OCPI) are mutually exclusive.');
  process.exit(1);
}

// Build the file list: base always, local override only with --local.
const files = ['-f', 'docker-compose.yml'];
if (local) files.push('-f', 'docker-compose.local.yml');

// Build the profile list: UI on by default (off with --solo), OCPI on with --ocpi.
const profiles = [];
if (!solo) profiles.push('ui');
if (ocpi) profiles.push('ocpi');
const profileArgs = profiles.flatMap((p) => ['--profile', p]);

const composeArgs = ['compose', ...files, ...profileArgs];
if (command === 'down') {
  composeArgs.push('down');
} else {
  composeArgs.push('up', '-d');
  // Force a rebuild when running from local source so edits are picked up.
  if (local) composeArgs.push('--build');
}

console.log(`> docker ${composeArgs.join(' ')}`);
const result = spawnSync('docker', composeArgs, { stdio: 'inherit', cwd: repoRoot });

if (result.error) {
  console.error(`Failed to run docker: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
