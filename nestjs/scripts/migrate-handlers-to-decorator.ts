// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * One-shot migration: rewrite every `*.handler.ts` that extends
 * `OcppRequestHandler` to use the new `@OcppHandler(...)` class decorator
 * instead of the four-line metadata preamble + per-handler Logger field.
 *
 * Idempotent: a file already migrated is left untouched. Skips response
 * handlers (those extend `CsmsResponseHandler`, not `OcppRequestHandler`).
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const repoRoot = join(__dirname, '..');
const filesRaw = execSync(
  `find ${join(repoRoot, 'src')} -name '*.handler.ts' -not -path '*/test/*'`,
)
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

let touched = 0;
let skipped = 0;

for (const file of filesRaw) {
  let src = readFileSync(file, 'utf8');

  // Skip files that already have @OcppHandler — idempotent.
  if (src.includes('@OcppHandler(')) {
    skipped++;
    continue;
  }

  // Skip files that don't extend OcppRequestHandler (e.g. CsmsResponseHandler).
  if (!/extends\s+OcppRequestHandler\s*</.test(src)) {
    skipped++;
    continue;
  }

  // ─── Extract the metadata triple ─────────────────────────────────────────
  const actionM = src.match(/readonly\s+action\s*=\s*(OCPP_CallAction\.[A-Za-z0-9_]+)\s*;/);
  const versionsM = src.match(/readonly\s+versions\s*=\s*(\[[^\]]*\])\s*;/);
  const requestClassM = src.match(/protected\s+readonly\s+requestClass\s*=\s*([A-Za-z0-9_]+)\s*;/);

  if (!actionM || !versionsM || !requestClassM) {
    console.warn(`⚠ ${file}: couldn't parse metadata triple, skipping`);
    skipped++;
    continue;
  }

  const action = actionM[1];
  const versions = versionsM[1];
  const requestClass = requestClassM[1];

  // ─── Replace `@Injectable()` (alone on a line) with `@OcppHandler(...)` ──
  const decorator = `@OcppHandler(${action}, ${versions}, ${requestClass})`;
  // Match the `@Injectable()` decorator immediately preceding the class.
  if (!/@Injectable\(\)\s*\nexport\s+class\s+\w+\s+extends\s+OcppRequestHandler/.test(src)) {
    console.warn(`⚠ ${file}: no @Injectable() before class, skipping`);
    skipped++;
    continue;
  }
  src = src.replace(
    /@Injectable\(\)\s*\nexport\s+class\s+(\w+)\s+extends\s+OcppRequestHandler/,
    `${decorator}\nexport class $1 extends OcppRequestHandler`,
  );

  // ─── Remove the four metadata lines (action / versions / requestClass / logger) ─
  src = src.replace(/^\s*readonly\s+action\s*=\s*OCPP_CallAction\.[A-Za-z0-9_]+\s*;\n/m, '');
  src = src.replace(/^\s*readonly\s+versions\s*=\s*\[[^\]]*\]\s*;\n/m, '');
  src = src.replace(/^\s*protected\s+readonly\s+requestClass\s*=\s*[A-Za-z0-9_]+\s*;\n/m, '');
  src = src.replace(
    /^\s*private\s+readonly\s+logger\s*=\s*new\s+Logger\([A-Za-z0-9_]+\.name\)\s*;\n/m,
    '',
  );

  // Collapse any blank line left between the class brace and the constructor.
  src = src.replace(/\{\n\s*\n\s*constructor/, '{\n  constructor');

  // ─── Imports ─────────────────────────────────────────────────────────────
  // Drop `Logger` from `@nestjs/common` if no other `this.logger` declarations
  // remain (the base class now provides it). Keep `Injectable` import only if
  // still used elsewhere — for handlers that's never the case after migration.
  src = src.replace(
    /import\s*\{\s*([^}]*)\}\s*from\s*'@nestjs\/common'\s*;\n/,
    (_, group: string) => {
      const idents = group
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((s) => s !== 'Injectable' && s !== 'Logger');
      if (idents.length === 0) return '';
      return `import { ${idents.join(', ')} } from '@nestjs/common';\n`;
    },
  );

  // Inject the OcppHandler decorator import next to the OcppRequestHandler import.
  if (!/from\s+'@ocpp\/ocpp-handler\.decorator'/.test(src)) {
    src = src.replace(
      /(import\s*\{[^}]*OcppRequestHandler[^}]*\}\s*from\s*'@ocpp\/ocpp-request-handler'\s*;)/,
      `import { OcppHandler } from '@ocpp/ocpp-handler.decorator';\n$1`,
    );
  }

  writeFileSync(file, src);
  touched++;
  console.log(`✓ ${file.replace(repoRoot + '/', '')}`);
}

console.log(`\nMigrated ${touched} handler(s); skipped ${skipped}.`);
