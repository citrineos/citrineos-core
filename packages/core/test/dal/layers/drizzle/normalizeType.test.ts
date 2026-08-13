// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { normalizeSqlType, sqlTypesMatch } from '@dal/layers/drizzle/validation/normalizeType.js';
import { describe, expect, it } from 'vitest';

/**
 * The expected values here were verified against a real PostgreSQL 16 instance by
 * creating a column of each drizzle type and reading back
 * `format_type(atttypid, atttypmod)`.
 */
describe('normalizeSqlType', () => {
  it.each([
    // Types drizzle and PostgreSQL spell identically.
    ['integer', 'integer'],
    ['bigint', 'bigint'],
    ['numeric', 'numeric'],
    ['numeric(10,2)', 'numeric(10,2)'],
    ['boolean', 'boolean'],
    ['text', 'text'],
    ['jsonb', 'jsonb'],
    ['citext', 'citext'],
    ['timestamp with time zone', 'timestamp with time zone'],
    ['double precision', 'double precision'],

    // serial is integer + a sequence default; format_type() reports the integer.
    ['serial', 'integer'],
    ['bigserial', 'bigint'],
    ['smallserial', 'smallint'],

    // drizzle's short spelling vs the SQL standard spelling format_type() reports.
    ['varchar(255)', 'character varying(255)'],
    ['character varying(255)', 'character varying(255)'],
    ['timestamptz', 'timestamp with time zone'],
    ['bool', 'boolean'],
    ['int4', 'integer'],
    ['decimal', 'numeric'],

    // Array suffixes survive normalization on both sides.
    ['varchar(255)[]', 'character varying(255)[]'],
    ['character varying(255)[]', 'character varying(255)[]'],

    // PostGIS: drizzle emits geometry(point), PostgreSQL reports geometry(Point).
    ['geometry(point)', 'geometry(point)'],
    ['geometry(Point)', 'geometry(point)'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeSqlType(input)).toBe(expected);
  });

  it('is whitespace and case insensitive', () => {
    expect(normalizeSqlType('  VARCHAR( 255 ) ')).toBe('character varying(255)');
  });

  describe('does not conflate genuinely different types', () => {
    it.each([
      ['varchar(255)', 'varchar(500)', 'length'],
      ['timestamptz', 'timestamp', 'time zone'],
      ['varchar(255)', 'varchar(255)[]', 'array-ness'],
      ['citext', 'text', 'case sensitivity'],
      ['numeric(10,2)', 'numeric', 'precision'],
      ['geometry(point)', 'geometry(Point,4326)', 'SRID'],
      ['integer', 'bigint', 'width'],
    ])('%s is not %s (differs by %s)', (a, b) => {
      expect(sqlTypesMatch(a, b)).toBe(false);
    });
  });

  it('matches drizzle and PostgreSQL spellings of the same type', () => {
    expect(sqlTypesMatch('varchar(255)', 'character varying(255)')).toBe(true);
    expect(sqlTypesMatch('serial', 'integer')).toBe(true);
  });
});
