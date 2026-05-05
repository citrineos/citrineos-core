// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Insert a tailored JSDoc block before every undocumented `export class`
 * so compodoc renders something useful for each entity. Idempotent: a
 * class that already has a JSDoc-closing line within 8 lines above is
 * left untouched.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { basename, join } from 'path';

const repoRoot = join(__dirname, '..');
const files = execSync(
  'find ' +
    join(repoRoot, 'src') +
    " -name '*.ts' -not -path '*/test/*' -not -name '*.test.ts' -not -name '*.spec.ts'",
)
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

let touched = 0;
let skipped = 0;

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const out: string[] = [];
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_]+)/);

    if (m) {
      const className = m[1];

      // Walk back over decorator lines (and the blank/comment lines between)
      // to find the start of the decorator chain.
      let firstLine = i;
      for (let j = i - 1; j >= 0; j--) {
        const t = lines[j].trim();
        if (t.startsWith('@')) {
          firstLine = j;
          continue;
        }
        if (t === '' || t.startsWith('//')) continue;
        break;
      }

      // Skip if a JSDoc block already exists within 8 lines above the
      // first decorator line (or above the class itself when undecorated).
      let hasDoc = false;
      for (let j = firstLine - 1; j >= Math.max(0, firstLine - 8); j--) {
        if (lines[j].trim().startsWith('*/')) {
          hasDoc = true;
          break;
        }
      }

      if (!hasDoc) {
        const doc = describeClass(file, className);
        const decoratorChainLength = i - firstLine;
        const decorators = out.splice(out.length - decoratorChainLength, decoratorChainLength);
        out.push(...doc);
        out.push(...decorators);
        modified = true;
      }
      out.push(line);
      continue;
    }

    out.push(line);
  }

  if (modified) {
    writeFileSync(file, out.join('\n'));
    touched++;
    console.log('✓ ' + file.replace(repoRoot + '/', ''));
  } else {
    skipped++;
  }
}

console.log('\nEnhanced ' + touched + ' file(s); skipped ' + skipped + ' (already documented).');

// ─── Doc inference ───────────────────────────────────────────────────────

function describeClass(file: string, className: string): string[] {
  const rel = file.replace(repoRoot + '/', '');
  const fname = basename(file);

  if (rel.match(/\/[^/]+\.module\.ts$/)) {
    const moduleName = className.replace(/ModuleService$/, '').replace(/Module$/, '');
    return wrap(
      'NestJS DI module wiring the ' + spaceCase(moduleName) + ' surface.',
      'Declares the providers, controllers, and re-exports that other modules',
      'consume to interact with this domain.',
    );
  }
  if (rel.match(/\.module-service\.ts$/)) {
    const name = className.replace(/ModuleService$/, '');
    return wrap(
      spaceCase(name) + ' module-service. Subclasses AbstractOcppModule to',
      'register this module’s request handlers and CSMS-initiated response',
      'handlers with the AMQP routing layer. Maps OCPP (action, version) pairs',
      'onto handler instances at boot.',
    );
  }
  if (rel.match(/\/repositories\/[^/]+\.repository\.ts$/)) {
    const name = className.replace(/Repository$/, '');
    return wrap(
      'Drizzle-backed repository for the ' + name + ' entity.',
      'Centralises every read/write path for this table so handlers and',
      'services don’t reach for the Drizzle client directly.',
    );
  }
  if (rel.match(/\/mappers\/.*\.mapper\.ts$/)) {
    return wrap(
      'Static mapper translating between OCPP wire DTOs and the corresponding',
      'database row shape. Handlers and services compose mappers rather than',
      'building entity rows inline so the wire ↔ entity contract stays in one place.',
    );
  }
  if (rel.match(/\/dto\//)) {
    if (fname.endsWith('.request.ts')) {
      return wrap(
        'OCPP wire request DTO. class-validator decorations on each field drive',
        'the global ValidationPipe so payloads are rejected with a',
        'PropertyConstraintViolation before any handler runs.',
      );
    }
    if (fname.endsWith('.response.ts')) {
      return wrap(
        'OCPP wire response DTO returned to the charger after handler processing.',
        'Shape mirrors the OCPP JSON-Schema spec; nested complex types live',
        'under dto/shared/.',
      );
    }
    return wrap(
      'Shared OCPP DTO referenced by multiple request/response shapes. Field-',
      'level class-validator decorations propagate validation guarantees into',
      'the parent DTO.',
    );
  }
  if (rel.match(/\/health\/[^/]+\.health\.ts$/)) {
    return wrap(
      'Terminus health indicator surfaced through the /health endpoint.',
      'Returns "up"/"down" plus structured details so operator probes can',
      'distinguish between subsystems.',
    );
  }
  if (rel.match(/\/health\/health\.controller\.ts$/)) {
    return wrap(
      '/health endpoint composing every Terminus health indicator. Each entry',
      'contributes one named subsystem to the composite check.',
    );
  }
  if (fname.endsWith('.controller.ts')) {
    return wrap(
      'REST controller. CSMS-initiated OCPP actions land here as',
      'POST /ocpp/{version}/{module}/{action} calls and are forwarded onto',
      'the AMQP bus via the appropriate dispatcher.',
    );
  }
  if (rel.match(/\/auth\/auth\.guard\.ts$/)) {
    return wrap(
      'Nest CanActivate guard. Allows requests through when',
      'util.authProvider.localByPass is true; otherwise validates the OIDC',
      'bearer token. Wired globally via APP_GUARD in AuthModule.',
    );
  }
  if (rel.match(/\/authorizers\//)) {
    return wrap(
      'Authorizer step in the (Database → EvseRestriction → RealTime) chain.',
      'Receives the current candidate IdTokenInfoDto and can refine, halt, or',
      'abstain. The first non-Accepted decision wins.',
    );
  }
  if (fname.endsWith('.service.ts')) {
    return wrap(
      'Domain service. Encapsulates business logic for one slice of the',
      'module so handlers and controllers stay thin and testable.',
    );
  }
  if (rel === 'src/config/config.schema.ts') {
    return wrap(className + ' config slice — class-validator-shaped data container.');
  }
  if (rel.match(/\/database\/drizzle\.module\.ts$/)) {
    return wrap(
      'Provides the DRIZZLE and PG_POOL injection tokens after wiring a pg.Pool',
      'against the resolved database config. Marked @Global so repositories',
      'everywhere can @Inject(DRIZZLE).',
    );
  }
  if (rel.match(/\/app\.module\.ts$/)) {
    return wrap(
      'Top-level NestJS module. Composes every cross-cutting module',
      '(Drizzle, AMQP, Cache, FileStorage, Webhooks, …) and the per-event-group',
      'domain modules selected by the APP_NAME env var.',
    );
  }
  return wrap(spaceCase(className) + '.');
}

function wrap(...lines: string[]): string[] {
  const out = ['/**'];
  for (const l of lines) out.push(' * ' + l);
  out.push(' */');
  return out;
}

function spaceCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}
