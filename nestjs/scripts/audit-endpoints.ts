// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * `@AsMessageEndpoint` ↔ `@Post(ocppRoute(...))` parity audit.
 *
 * Walks the legacy `core/src/modules/*` for `@AsMessageEndpoint(OCPP_CallAction.X)`
 * decorations and the nestjs `src/modules/*` for `@Post(ocppRoute(OCPPVersionSegment.X, _, 'action'))`
 * declarations, then prints the (action, version) diff:
 *
 *   • endpoints in LEGACY but not NESTJS  (gaps to port)
 *   • endpoints in NESTJS but not LEGACY  (rogue additions to remove)
 *
 * Run:    cd nestjs && npx ts-node -r tsconfig-paths/register --project tsconfig.json scripts/audit-endpoints.ts
 *
 * Pure static analysis — no DB / containers needed. Mirrors `scripts/diff-schema.ts`'s
 * shape so both audits live side-by-side.
 *
 * The version inference for legacy keys off the directory: `module/1.6/...`
 * yields `1.6`; `module/2/...` yields both `2.0.1` and `2.1` (legacy lumps
 * them in the same MessageApi class with `OCPP_2_VER_LIST`-style multi-version
 * decorators downstream).
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const MONOREPO_ROOT = join(__dirname, '..', '..');
const LEGACY_MODULES_ROOT = join(MONOREPO_ROOT, 'core', 'src', 'modules');
const NESTJS_MODULES_ROOT = join(__dirname, '..', 'src', 'modules');

type Endpoint = { action: string; version: string };

/**
 * Documented-intentional misses — actions that legacy exposes a REST endpoint
 * for but which we deliberately do not, with the rationale captured in
 * `endpoint-audit.md`. The CI gate ignores these so an expected gap doesn't
 * fail the run; any *new* gap still fails.
 */
const ALLOWED_LEGACY_ONLY: ReadonlySet<string> = new Set([
  // ClearedChargingLimit is charger-initiated per OCPP 2.0.1 spec. Legacy
  // exposing a CSMS-side `@AsMessageEndpoint` for it is a copy-paste artifact
  // (see `endpoint-audit.md`). We have the charger-side request handler.
  'ClearedChargingLimit@2.0.1',
  'ClearedChargingLimit@2.1',
]);

function walk(dir: string, predicate: (path: string) => boolean): string[] {
  const out: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === 'test') continue;
      out.push(...walk(full, predicate));
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Extract `OCPP_CallAction.<Name>` from a legacy `@AsMessageEndpoint(...)` block.
 * The decorator may span multiple lines; we anchor on the opening paren and scan
 * forward until we find the action ref.
 *
 * Version inference: `module/1.6/` → `1.6`; `module/2/` is dual-version by default
 * (2.0.1 + 2.1) but we narrow to `2.1` when the per-method body references the
 * `OCPP2_1.` namespace exclusively for its request type — that's how legacy
 * encodes 2.1-only features that physically live in the same MessageApi file
 * (e.g. `SetDefaultTariff`).
 *
 * Multiple decorations on the same method (different signatures / overloads)
 * are deduplicated by the caller.
 */
function legacyEndpointsIn(file: string): Endpoint[] {
  const text = readFileSync(file, 'utf8');
  const out: Endpoint[] = [];
  const baseVersions = file.includes('/module/1.6/')
    ? ['1.6']
    : file.includes('/module/2/')
      ? ['2.0.1', '2.1']
      : [];
  if (baseVersions.length === 0) return out;

  const decoratorRe = /@AsMessageEndpoint\(\s*OCPP_CallAction\.(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = decoratorRe.exec(text)) !== null) {
    const action = match[1];
    const versions =
      baseVersions.length === 2 ? narrowToVersionsByBody(text, match.index) : baseVersions;
    for (const version of versions) {
      out.push({ action, version });
    }
  }
  return out;
}

/**
 * Look at the ~600 chars of legacy method body that follow an
 * `@AsMessageEndpoint(...)` decorator. Detect whether the method dispatches
 * to OCPP 2.1 only (via `OCPPVersion.OCPP2_1` default + `OCPP2_1.<X>Request`
 * parameter type) or OCPP 2.0.1 only. Default: both.
 */
function narrowToVersionsByBody(text: string, decoratorStart: number): string[] {
  const slice = text.slice(decoratorStart, decoratorStart + 600);
  const ref21 = /\bOCPP2_1\.[A-Z]\w*Request\b|\?\?\s*OCPPVersion\.OCPP2_1\b/.test(slice);
  const ref201 = /\bOCPP2_0_1\.[A-Z]\w*Request\b|\?\?\s*OCPPVersion\.OCPP2_0_1\b/.test(slice);
  if (ref21 && !ref201) return ['2.1'];
  if (ref201 && !ref21) return ['2.0.1'];
  return ['2.0.1', '2.1'];
}

/**
 * Extract `(versionSegment, _, 'action')` triples from nestjs
 * `@Post(ocppRoute(OCPPVersionSegment.<V>, ModuleSegment.<M>, '<action>'))`.
 * The action segment is camelCase (e.g. 'changeConfiguration'); we map back
 * to the OCPP action enum (PascalCase).
 */
function nestjsEndpointsIn(file: string): Endpoint[] {
  const text = readFileSync(file, 'utf8');
  const out: Endpoint[] = [];
  const re = /ocppRoute\(\s*OCPPVersionSegment\.(\w+),\s*ModuleSegment\.\w+,\s*'([^']+)'\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const versionEnum = match[1];
    const actionSegment = match[2];
    const version =
      versionEnum === 'V1_6'
        ? '1.6'
        : versionEnum === 'V2_0_1'
          ? '2.0.1'
          : versionEnum === 'V2_1'
            ? '2.1'
            : versionEnum;
    out.push({ action: pascalCase(actionSegment), version });
  }
  return out;
}

/** `'getChargingProfiles'` → `'GetChargingProfiles'`. */
function pascalCase(camel: string): string {
  if (camel.length === 0) return camel;
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function key(e: Endpoint): string {
  return `${e.action}@${e.version}`;
}

function uniqueByKey(endpoints: Endpoint[]): Endpoint[] {
  const seen = new Set<string>();
  const out: Endpoint[] = [];
  for (const e of endpoints) {
    const k = key(e);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

function uniqueActions(endpoints: Endpoint[]): Set<string> {
  return new Set(endpoints.map((e) => e.action));
}

function main(): void {
  const legacyFiles = walk(LEGACY_MODULES_ROOT, (p) => p.endsWith('.ts')).filter((p) =>
    /\/MessageApi\.ts$/.test(p),
  );
  const nestjsFiles = walk(NESTJS_MODULES_ROOT, (p) => p.endsWith('.ts')).filter((p) =>
    /-ocpp\.controller\.ts$/.test(p),
  );

  const legacy = uniqueByKey(legacyFiles.flatMap(legacyEndpointsIn));
  const nestjs = uniqueByKey(nestjsFiles.flatMap(nestjsEndpointsIn));

  const legacyKeys = new Set(legacy.map(key));
  const nestjsKeys = new Set(nestjs.map(key));

  const onlyLegacy = legacy.filter((e) => !nestjsKeys.has(key(e)));
  const onlyNestjs = nestjs.filter((e) => !legacyKeys.has(key(e)));

  console.log(`Legacy MessageApi files: ${legacyFiles.length}`);
  console.log(`NestJS controller files: ${nestjsFiles.length}`);
  console.log(`Legacy unique actions: ${uniqueActions(legacy).size}`);
  console.log(`NestJS unique actions: ${uniqueActions(nestjs).size}`);
  console.log(`Legacy total (action, version) endpoints: ${legacy.length}`);
  console.log(`NestJS total (action, version) endpoints: ${nestjs.length}`);
  console.log('');

  const unexpectedLegacyOnly = onlyLegacy.filter((e) => !ALLOWED_LEGACY_ONLY.has(key(e)));
  const allowedLegacyOnly = onlyLegacy.filter((e) => ALLOWED_LEGACY_ONLY.has(key(e)));

  if (unexpectedLegacyOnly.length === 0) {
    console.log('✅ No unexpected endpoints in legacy that are missing from nestjs.');
  } else {
    console.log(`⚠️  Endpoints in LEGACY but not NESTJS (${unexpectedLegacyOnly.length}):`);
    for (const e of unexpectedLegacyOnly.sort((a, b) => key(a).localeCompare(key(b)))) {
      const file = legacyFiles.find((f) =>
        readFileSync(f, 'utf8').includes(`OCPP_CallAction.${e.action}`),
      );
      const where = file ? relative(MONOREPO_ROOT, file) : '?';
      console.log(`  - ${e.action}@${e.version}  ←  ${where}`);
    }
  }
  if (allowedLegacyOnly.length > 0) {
    console.log(
      `   (skipping ${allowedLegacyOnly.length} documented-intentional miss${allowedLegacyOnly.length === 1 ? '' : 'es'}: ${allowedLegacyOnly.map(key).join(', ')})`,
    );
  }
  console.log('');

  if (onlyNestjs.length === 0) {
    console.log('✅ No endpoints in nestjs that are absent from legacy.');
  } else {
    console.log(`⚠️  Endpoints in NESTJS but not LEGACY (${onlyNestjs.length}):`);
    for (const e of onlyNestjs.sort((a, b) => key(a).localeCompare(key(b)))) {
      console.log(`  - ${e.action}@${e.version}`);
    }
  }

  // Non-zero exit on any *unexpected* parity gap — keeps CI honest while
  // letting documented intentional skips pass cleanly.
  if (unexpectedLegacyOnly.length > 0 || onlyNestjs.length > 0) {
    process.exitCode = 1;
  }
}

main();
