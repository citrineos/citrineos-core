// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SchemaFinding } from './validateSchema.js';

export type SchemaValidationMode = 'strict' | 'warn' | 'off';

const RULE = '='.repeat(78);

/**
 * Parses the `CITRINEOS_SCHEMA_VALIDATION` environment variable.
 *
 * An unrecognised value falls back to `strict` and reports the problem, rather than
 * silently disabling validation because of a typo.
 */
export function resolveValidationMode(raw: string | undefined): {
  mode: SchemaValidationMode;
  warning?: string;
} {
  if (raw === undefined || raw === '') return { mode: 'strict' };

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'strict' || normalized === 'warn' || normalized === 'off') {
    return { mode: normalized };
  }

  return {
    mode: 'strict',
    warning:
      `Unrecognised CITRINEOS_SCHEMA_VALIDATION value "${raw}" ` +
      `(expected strict, warn or off) — falling back to strict.`,
  };
}

/**
 * Renders findings for a log. Optimised for someone reading the last screen of a
 * crashed container: the count first, then how to fix it, then the detail grouped by
 * table with the runtime impact alongside each finding.
 */
export function formatDriftReport(findings: SchemaFinding[], mode: SchemaValidationMode): string {
  const byTable = new Map<string, SchemaFinding[]>();
  for (const finding of findings) {
    const list = byTable.get(finding.table);
    if (list) list.push(finding);
    else byTable.set(finding.table, [finding]);
  }

  const lines: string[] = [
    '',
    RULE,
    ` DATABASE SCHEMA DRIFT — ${findings.length} issue(s) across ${byTable.size} table(s)`,
    RULE,
    ' The drizzle TypeScript schema and the live PostgreSQL schema disagree.',
    '',
    ' Fix by EITHER:',
    '   - migrating the database so it matches the schema, or',
    '   - correcting the schema file under',
    '     packages/core/src/dal/layers/drizzle/schema/ so it matches the database.',
    '',
  ];

  const sorted = [...byTable.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [table, tableFindings] of sorted) {
    lines.push(` ${table}`);
    for (const finding of tableFindings) {
      const target = finding.column
        ? `column "${finding.column}"`
        : finding.index
          ? `index "${finding.index}"`
          : 'table';
      lines.push(`   x [${finding.kind}] ${target}`);
      lines.push(`       declared in TypeScript : ${finding.declared}`);
      lines.push(`       found in PostgreSQL    : ${finding.actual}`);
      lines.push(`       impact                 : ${finding.impact}`);
    }
    lines.push('');
  }

  lines.push(
    ` Validation mode: ${mode}.`,
    ' Set CITRINEOS_SCHEMA_VALIDATION=warn to start anyway and log this instead,',
    ' or =off to skip validation entirely (not recommended outside local development).',
    RULE,
    '',
  );

  return lines.join('\n');
}
