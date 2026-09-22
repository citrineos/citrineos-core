// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const SCANNED_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies'];
const LOCAL_SPEC_PREFIXES = ['workspace:', 'link:', 'file:', 'catalog:'];

const args = process.argv.slice(2);
const sharedRuleArg = args.find((arg) => arg.startsWith('--shared='));
const sharedRule = sharedRuleArg ? sharedRuleArg.slice('--shared='.length) : 'error';

if (!['error', 'warn', 'off'].includes(sharedRule)) {
  console.error(`Unknown --shared mode "${sharedRule}". Use error, warn or off.`);
  process.exit(2);
}

function readWorkspace() {
  const path = join(repoRoot, 'pnpm-workspace.yaml');
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);

  // Hand-parsed rather than pulled through a YAML dependency: both blocks are flat and this
  // script has to run before install. Named catalogs would break that assumption, so bail.
  if (lines.some((line) => /^catalogs:/.test(line))) {
    console.error(
      'pnpm-workspace.yaml uses named catalogs; this check only understands the flat `catalog:` block.',
    );
    process.exit(2);
  }

  const members = [];
  const catalog = new Map();
  let block = null;

  for (const line of lines) {
    if (/^\S/.test(line)) {
      block = /^packages:/.test(line) ? 'packages' : /^catalog:/.test(line) ? 'catalog' : null;
      continue;
    }
    if (!block || !line.trim() || line.trim().startsWith('#')) continue;

    if (block === 'packages') {
      const match = line.match(/^\s+-\s*["']?([^"'\s]+)["']?/);
      if (match) members.push(match[1]);
      continue;
    }

    // Scoped names are quoted ("@fastify/auth"), plain ones are not. Each quoting style is its own
    // alternative, so the name is whichever of the three groups matched.
    const match = line.match(/^\s+(?:"([^"]+)"|'([^']+)'|([^\s:]+))\s*:\s*(\S+)/);
    if (match) catalog.set(match[1] ?? match[2] ?? match[3], match[4]);
  }

  if (members.length === 0 || catalog.size === 0) {
    console.error(
      'Could not read the packages list or the catalog block from pnpm-workspace.yaml.',
    );
    process.exit(2);
  }

  return { members, catalog };
}

function readManifests(members) {
  const manifests = [];

  for (const dir of ['.', ...members]) {
    const path = join(repoRoot, dir, 'package.json');
    if (!existsSync(path)) {
      console.error(`Workspace member "${dir}" has no package.json.`);
      process.exit(2);
    }
    manifests.push({
      name: dir === '.' ? '<root>' : dir,
      json: JSON.parse(readFileSync(path, 'utf8')),
    });
  }

  return manifests;
}

const { members, catalog } = readWorkspace();
const manifests = readManifests(members);

const declarations = manifests.flatMap(({ name: member, json }) =>
  SCANNED_FIELDS.flatMap((field) =>
    Object.entries(json[field] ?? {}).map(([dep, spec]) => ({ member, field, dep, spec })),
  ),
);

const literalCatalogRefs = declarations.filter(
  ({ dep, spec }) => catalog.has(dep) && spec !== 'catalog:',
);

const registryDeclarations = declarations.filter(
  ({ spec }) => !LOCAL_SPEC_PREFIXES.some((prefix) => spec.startsWith(prefix)),
);

const uncatalogedShared = [...Map.groupBy(registryDeclarations, ({ dep }) => dep)]
  .map(([dep, declared]) => ({
    dep,
    users: [...new Set(declared.map((one) => one.member))].sort(),
  }))
  .filter(({ dep, users }) => users.length > 1 && !catalog.has(dep))
  .sort((a, b) => a.dep.localeCompare(b.dep));

if (literalCatalogRefs.length > 0) {
  console.error(
    `\n${literalCatalogRefs.length} dependency reference(s) pin a version that the catalog already owns:`,
  );
  for (const { member, field, dep, spec } of literalCatalogRefs) {
    console.error(
      `  ${member} ${field}: "${dep}": "${spec}"  ->  "catalog:" (catalog has ${catalog.get(dep)})`,
    );
  }
  console.error('\nReference the catalog instead, and bump the version in pnpm-workspace.yaml.');
}

if (uncatalogedShared.length > 0 && sharedRule !== 'off') {
  const label = sharedRule === 'error' ? 'error' : 'warning';
  const log = sharedRule === 'error' ? console.error : console.warn;
  log(
    `\n${uncatalogedShared.length} dependency(ies) used by more than one workspace member are not in the catalog (${label}):`,
  );
  for (const { dep, users } of uncatalogedShared) {
    log(`  ${dep} — ${users.join(', ')}`);
  }
  log('\nAdd each to the catalog: block in pnpm-workspace.yaml and reference it as "catalog:".');
}

const failed =
  literalCatalogRefs.length > 0 || (sharedRule === 'error' && uncatalogedShared.length > 0);

if (!failed) {
  console.log(
    `Dependency catalog check passed: ${catalog.size} cataloged packages across ${manifests.length} manifests.`,
  );
}

process.exit(failed ? 1 : 0);
