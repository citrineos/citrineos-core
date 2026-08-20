// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ApiClient } from '../fixtures/api-client';

// The Hasura introspection slice we track. We deliberately do NOT snapshot
// full GraphQL types — only the operations the UI depends on plus the
// selection-set columns of the tables it reads. This keeps the snapshot
// stable under benign schema growth (adding a new column / operation is
// silent), and surfaces the regressions we actually care about (a tracked
// operation disappears, or a column the UI selects is renamed).

export interface SchemaSnapshot {
  readonly operations: ReadonlyArray<string>;
  readonly columnsByType: Readonly<Record<string, ReadonlyArray<string>>>;
  // Rendered arg signatures ("id: Int!") for the tracked tables' by-pk and
  // insert-one operations. Optional so older snapshots keep validating —
  // the check only runs once the snapshot is regenerated with this field.
  // Without it a mutation declaring `$id: bigint!` against an `Int!` schema
  // fails Hasura validation silently (that exact bug leaked every seeded
  // location for weeks).
  readonly argTypesByOperation?: Readonly<Record<string, ReadonlyArray<string>>>;
}

export interface SchemaDriftReport {
  readonly valid: boolean;
  readonly missingOperations: ReadonlyArray<string>;
  readonly missingColumns: ReadonlyArray<{ type: string; column: string }>;
  readonly changedArgs: ReadonlyArray<{ operation: string; expected: string; actual: string }>;
}

interface IntrospectionTypeRef {
  readonly kind: string;
  readonly name: string | null;
  readonly ofType?: IntrospectionTypeRef | null;
}

interface IntrospectionField {
  readonly name: string;
  readonly args?: ReadonlyArray<{ readonly name: string; readonly type: IntrospectionTypeRef }>;
  readonly type?: {
    readonly name: string | null;
    readonly ofType?: { readonly name: string | null } | null;
  } | null;
}

interface IntrospectionType {
  readonly name: string;
  readonly kind: string;
  readonly fields?: ReadonlyArray<IntrospectionField> | null;
}

interface IntrospectionSchema {
  readonly queryType: { readonly name: string } | null;
  readonly mutationType: { readonly name: string } | null;
  readonly types: ReadonlyArray<IntrospectionType>;
}

const INTROSPECTION_QUERY = `
  query SchemaSnapshotIntrospection {
    __schema {
      queryType { name }
      mutationType { name }
      types {
        name
        kind
        fields {
          name
          args {
            name
            type {
              kind
              name
              ofType { kind name ofType { kind name ofType { kind name } } }
            }
          }
        }
      }
    }
  }
`;

// The Hasura tables whose select-column shape we track. Add a row here
// whenever a new query starts selecting a previously-untracked table.
const TRACKED_TABLES: ReadonlyArray<string> = [
  'ChargingStations',
  'Locations',
  'Transactions',
  'Authorizations',
  'Connectors',
  'Evses',
  'StatusNotifications',
  'LatestStatusNotifications',
  'OCPPMessages',
  'Tariffs',
  'TenantPartners',
];

function renderTypeRef(ref: IntrospectionTypeRef | null | undefined): string {
  if (!ref) return 'Unknown';
  if (ref.kind === 'NON_NULL') return `${renderTypeRef(ref.ofType)}!`;
  if (ref.kind === 'LIST') return `[${renderTypeRef(ref.ofType)}]`;
  return ref.name ?? 'Unknown';
}

// The operations whose argument types we pin — the by-pk mutations are where
// a wrong variable declaration fails Hasura validation before execution.
const TRACKED_ARG_OPERATIONS: ReadonlyArray<string> = TRACKED_TABLES.flatMap((t) => [
  `delete_${t}_by_pk`,
  `update_${t}_by_pk`,
  `insert_${t}_one`,
]);

export async function captureHasuraIntrospection(api: ApiClient): Promise<SchemaSnapshot> {
  const data = await api.gql<{ __schema: IntrospectionSchema }>(INTROSPECTION_QUERY);
  const schema = data.__schema;

  const queryType = schema.types.find((t) => t.name === (schema.queryType?.name ?? ''));
  const mutationType = schema.types.find((t) => t.name === (schema.mutationType?.name ?? ''));
  const operationNames = new Set<string>();
  for (const f of queryType?.fields ?? []) operationNames.add(f.name);
  for (const f of mutationType?.fields ?? []) operationNames.add(f.name);

  const columnsByType: Record<string, string[]> = {};
  for (const tableName of TRACKED_TABLES) {
    const t = schema.types.find((x) => x.name === tableName);
    if (!t || !t.fields) continue;
    columnsByType[tableName] = t.fields.map((f) => f.name).sort();
  }

  const argTypesByOperation: Record<string, string[]> = {};
  const rootFields = [...(queryType?.fields ?? []), ...(mutationType?.fields ?? [])];
  for (const opName of TRACKED_ARG_OPERATIONS) {
    const field = rootFields.find((f) => f.name === opName);
    if (!field?.args?.length) continue;
    argTypesByOperation[opName] = field.args
      .map((a) => `${a.name}: ${renderTypeRef(a.type)}`)
      .sort();
  }

  return {
    operations: Array.from(operationNames).sort(),
    columnsByType,
    argTypesByOperation,
  };
}

export function validateSchemaDrift(
  current: SchemaSnapshot,
  baseline: SchemaSnapshot,
): SchemaDriftReport {
  const currentOps = new Set(current.operations);
  const missingOperations = baseline.operations.filter((op) => !currentOps.has(op));

  const missingColumns: { type: string; column: string }[] = [];
  for (const [type, baselineCols] of Object.entries(baseline.columnsByType)) {
    const currentCols = new Set(current.columnsByType[type] ?? []);
    for (const col of baselineCols) {
      if (!currentCols.has(col)) missingColumns.push({ type, column: col });
    }
  }

  const changedArgs: { operation: string; expected: string; actual: string }[] = [];
  if (baseline.argTypesByOperation) {
    for (const [op, baselineArgs] of Object.entries(baseline.argTypesByOperation)) {
      const currentArgs = current.argTypesByOperation?.[op];
      if (!currentArgs) continue; // operation absence is already reported above
      const expected = baselineArgs.join(', ');
      const actual = currentArgs.join(', ');
      if (expected !== actual) changedArgs.push({ operation: op, expected, actual });
    }
  }

  return {
    valid:
      missingOperations.length === 0 && missingColumns.length === 0 && changedArgs.length === 0,
    missingOperations,
    missingColumns,
    changedArgs,
  };
}

export function formatDriftMessage(report: SchemaDriftReport): string {
  const lines: string[] = [];
  if (report.missingOperations.length > 0) {
    lines.push(`Missing operations: ${report.missingOperations.join(', ')}`);
  }
  if (report.missingColumns.length > 0) {
    lines.push(
      `Missing columns: ${report.missingColumns.map((m) => `${m.type}.${m.column}`).join(', ')}`,
    );
  }
  if (report.changedArgs.length > 0) {
    lines.push(
      `Changed argument types: ${report.changedArgs
        .map((c) => `${c.operation} (expected ${c.expected}, got ${c.actual})`)
        .join('; ')}`,
    );
  }
  return lines.join('\n');
}
