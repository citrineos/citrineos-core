// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Sibling of `migrate-handlers-to-decorator.ts` for `*.response-handler.ts`.
 * Rewrites every file extending `CsmsResponseHandler` to use the new
 * `@OcppResponseHandler(action, versions)` decorator instead of the
 * three-line metadata preamble + per-handler `Logger` field.
 *
 * Idempotent: a file already migrated is left untouched.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const repoRoot = join(__dirname, '..');
const filesRaw = execSync(
  `find ${join(repoRoot, 'src')} -name '*.response-handler.ts' -not -path '*/test/*'`,
)
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

let touched = 0;
let skipped = 0;

for (const file of filesRaw) {
  let src = readFileSync(file, 'utf8');

  if (src.includes('@OcppResponseHandler(')) {
    skipped++;
    continue;
  }
  if (!/extends\s+CsmsResponseHandler\s*</.test(src)) {
    skipped++;
    continue;
  }

  const actionM = src.match(/readonly\s+action\s*=\s*(OCPP_CallAction\.[A-Za-z0-9_]+)\s*;/);
  const versionsM = src.match(/readonly\s+versions\s*=\s*(\[[^\]]*\])\s*;/);
  if (!actionM || !versionsM) {
    console.warn(`⚠ ${file}: couldn't parse metadata, skipping`);
    skipped++;
    continue;
  }

  const decorator = `@OcppResponseHandler(${actionM[1]}, ${versionsM[1]})`;
  if (!/@Injectable\(\)\s*\nexport\s+class\s+\w+\s+extends\s+CsmsResponseHandler/.test(src)) {
    console.warn(`⚠ ${file}: no @Injectable() before class, skipping`);
    skipped++;
    continue;
  }
  src = src.replace(
    /@Injectable\(\)\s*\nexport\s+class\s+(\w+)\s+extends\s+CsmsResponseHandler/,
    `${decorator}\nexport class $1 extends CsmsResponseHandler`,
  );

  src = src.replace(/^\s*readonly\s+action\s*=\s*OCPP_CallAction\.[A-Za-z0-9_]+\s*;\n/m, '');
  src = src.replace(/^\s*readonly\s+versions\s*=\s*\[[^\]]*\]\s*;\n/m, '');
  src = src.replace(
    /^\s*private\s+readonly\s+logger\s*=\s*new\s+Logger\([A-Za-z0-9_]+\.name\)\s*;\n/m,
    '',
  );

  // Collapse blank between class brace and constructor / handle.
  src = src.replace(/\{\n\s*\n\s*(constructor|async handle|handle)/, '{\n  $1');

  // Drop `Logger` and `Injectable` from `@nestjs/common` when no longer used.
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

  if (!/from\s+'@ocpp\/ocpp-handler\.decorator'/.test(src)) {
    src = src.replace(
      /(import\s*\{[^}]*CsmsResponseHandler[^}]*\}\s*from\s*'@ocpp\/csms-response-handler'\s*;)/,
      `import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';\n$1`,
    );
  }

  writeFileSync(file, src);
  touched++;
  console.log(`✓ ${file.replace(repoRoot + '/', '')}`);
}

console.log(`\nMigrated ${touched} response handler(s); skipped ${skipped}.`);
