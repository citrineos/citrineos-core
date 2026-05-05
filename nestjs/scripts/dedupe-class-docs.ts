// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * The earlier `enhance-class-docs.ts` pass occasionally inserted a
 * generic JSDoc block above a class that already had a more specific
 * doc immediately above it (a single-line `/** ... *\/` on its own
 * line). Result: two adjacent JSDoc blocks. Compodoc + the swagger
 * plugin pick up the last one, so we end up displaying the generic
 * boilerplate instead of the specific original.
 *
 * This script collapses adjacent JSDoc blocks above an `export class`,
 * keeping the **first** (specific) block and dropping the second
 * (generic) when the second matches one of the known generic
 * templates.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const repoRoot = join(__dirname, '..');
const files = execSync('find ' + join(repoRoot, 'src') + " -name '*.ts' -not -path '*/test/*'")
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

const GENERIC_PATTERNS = [
  'OCPP wire request DTO. class-validator decorations on each field drive',
  'OCPP wire response DTO returned to the charger after handler processing.',
  'Shared OCPP DTO referenced by multiple request/response shapes. Field-',
  'NestJS DI module wiring the',
  'Drizzle-backed repository for the',
  'Static mapper translating between OCPP wire DTOs and the corresponding',
  'Terminus health indicator surfaced through the /health endpoint.',
  'REST controller. CSMS-initiated OCPP actions land here as',
  'Authorizer step in the (Database → EvseRestriction → RealTime) chain.',
  '/health endpoint composing every Terminus health indicator',
  'config slice — class-validator-shaped data container.',
  'module-service. Subclasses AbstractOcppModule to',
];

function isGenericDoc(block: string[]): boolean {
  return GENERIC_PATTERNS.some((p) => block.some((l) => l.includes(p)));
}

let touched = 0;
let skipped = 0;

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const out: string[] = [];
  let modified = false;
  let i = 0;

  const isJsdocOpen = (l: string) => l.trim().startsWith('/**');
  const isSingleLineJsdoc = (l: string) =>
    /^\s*\/\*\*.*\*\/\s*$/.test(l) && !l.trim().endsWith('*/ ');

  while (i < lines.length) {
    if (isJsdocOpen(lines[i])) {
      // Capture this JSDoc block (single- or multi-line).
      const start = i;
      let j = i;
      if (!isSingleLineJsdoc(lines[i])) {
        while (j < lines.length && !lines[j].trim().endsWith('*/')) j++;
      }
      const firstBlock = lines.slice(start, j + 1);
      let cursor = j + 1;
      while (cursor < lines.length && lines[cursor].trim() === '') cursor++;
      if (cursor < lines.length && isJsdocOpen(lines[cursor])) {
        const start2 = cursor;
        let k = cursor;
        if (!isSingleLineJsdoc(lines[cursor])) {
          while (k < lines.length && !lines[k].trim().endsWith('*/')) k++;
        }
        const secondBlock = lines.slice(start2, k + 1);
        // What follows the second block?
        let next = k + 1;
        while (next < lines.length && lines[next].trim() === '') next++;
        const followsClass =
          next < lines.length &&
          /^(export\s+(?:abstract\s+)?class\s+|@[A-Za-z])/.test(lines[next].trim());
        if (followsClass && isGenericDoc(secondBlock) && !isGenericDoc(firstBlock)) {
          // Keep firstBlock, drop the blank lines + secondBlock.
          out.push(...firstBlock);
          // Re-emit a single blank separator if we had one before the class.
          out.push('');
          i = k + 1;
          // Skip any blank lines between dropped block and next non-blank.
          while (i < lines.length && lines[i].trim() === '') i++;
          modified = true;
          continue;
        }
      }
      // No dedupe — emit firstBlock as-is.
      out.push(...firstBlock);
      i = j + 1;
      continue;
    }
    out.push(lines[i]);
    i++;
  }

  if (modified) {
    writeFileSync(file, out.join('\n'));
    touched++;
    console.log('✓ ' + file.replace(repoRoot + '/', ''));
  } else {
    skipped++;
  }
}

console.log('\nDeduped ' + touched + ' file(s); skipped ' + skipped + '.');
