// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export { normalizeSqlType, sqlTypesMatch } from './normalizeType.js';
export {
  registeredTables,
  registeredTableNames,
  tableMap,
  type RegisteredTable,
} from './registry.js';
export {
  introspectColumns,
  introspectIndexNames,
  type DbColumn,
  type DbIndex,
} from './introspect.js';
export {
  validateDrizzleSchema,
  SchemaDriftError,
  type SchemaFinding,
  type SchemaFindingKind,
  type ValidateSchemaOptions,
} from './validateSchema.js';
export { formatDriftReport, resolveValidationMode, type SchemaValidationMode } from './report.js';
