// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * A reusable GraphQL selection-set snippet: an ordered list of scalar field names for one entity,
 * with `pick`/`omit` so a query can take only the fields it needs.
 *
 * It interpolates straight into a `gql` selection — `graphql-tag` coerces interpolated values to
 * string (`result += value`), which calls `toString()`:
 *
 *   Location { ${LOCATION_CORE_FIELDS} }                     // full
 *   Location { ${LOCATION_CORE_FIELDS.omit('id')} }          // exclude
 *   Connector { ${CONNECTOR_SPEC_FIELDS.pick('type', 'tariffId')} }   // include a subset
 *
 * `pick`/`omit` return new FieldSets, so they compose and chain. Field lists hold only one entity's
 * own scalar fields (no nested relations) — nesting is composed at the query level — which keeps these
 * free of cross-entity imports and therefore free of circular dependencies.
 */
export interface FieldSet {
  /** The ordered field names. */
  readonly fields: readonly string[];
  /** The GraphQL selection snippet (newline-indented), produced on string coercion. */
  toString(): string;
  /** Keep only the named fields (order follows the original list). */
  pick(...names: string[]): FieldSet;
  /** Drop the named fields. */
  omit(...names: string[]): FieldSet;
}

export const fieldSet = (fields: readonly string[]): FieldSet => ({
  fields,
  toString: () => `\n${fields.map((f) => `  ${f}`).join('\n')}\n`,
  pick: (...names: string[]) => fieldSet(fields.filter((f) => names.includes(f))),
  omit: (...names: string[]) => fieldSet(fields.filter((f) => !names.includes(f))),
});
