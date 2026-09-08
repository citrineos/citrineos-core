// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { serializeError } from '@base-util/errors.js';

/** What a JSON logger actually writes for a given argument. */
const asLogged = (value: unknown) => JSON.stringify(serializeError(value));

describe('serializeError', () => {
  it('keeps the message of a plain Error, which JSON.stringify drops', () => {
    expect(JSON.stringify(new Error('boom'))).toBe('{}');

    expect(serializeError(new Error('boom'))).toMatchObject({
      name: 'Error',
      message: 'boom',
    });
    expect(asLogged(new Error('boom'))).toContain('boom');
  });

  it('keeps the subclass name for built-in error types', () => {
    expect(serializeError(new TypeError('not a function'))).toMatchObject({
      name: 'TypeError',
      message: 'not a function',
    });
  });

  it('includes a stack', () => {
    expect(serializeError(new Error('boom'))).toHaveProperty('stack', expect.any(String));
  });

  it('preserves the library diagnostics libraries attach as own properties', () => {
    const dbError = Object.assign(new Error('insert failed'), {
      sql: 'INSERT INTO "StatusNotifications" ...',
      table: 'StatusNotifications',
    });

    expect(serializeError(dbError)).toMatchObject({
      message: 'insert failed',
      sql: 'INSERT INTO "StatusNotifications" ...',
      table: 'StatusNotifications',
    });
  });

  it('walks nested driver errors so the underlying reason survives', () => {
    const error = Object.assign(new Error('Validation error'), {
      original: { code: '23503', detail: 'Key (connectorId)=(1) is not present.' },
    });

    expect(asLogged(error)).toContain('Key (connectorId)=(1) is not present.');
  });

  it('follows a non-enumerable cause', () => {
    const error = new Error('outer', { cause: new Error('inner') });

    expect(serializeError(error)).toMatchObject({
      message: 'outer',
      cause: { message: 'inner' },
    });
  });

  it('does not let an own property shadow the recovered message', () => {
    const error = Object.assign(new Error('the real message'), { message: 'the real message' });

    expect(serializeError(error)).toMatchObject({ message: 'the real message' });
  });

  // Called from catch blocks: throwing here would mask the failure being reported.
  it('survives a cyclic error without throwing', () => {
    const error = new Error('cyclic') as Error & { self?: unknown };
    error.self = error;

    expect(() => asLogged(error)).not.toThrow();
    expect(asLogged(error)).toContain('cyclic');
  });

  it('survives deeply nested structures without throwing', () => {
    let nested: Record<string, unknown> = { bottom: true };
    for (let i = 0; i < 50; i++) {
      nested = { nested };
    }

    expect(() => asLogged(Object.assign(new Error('deep'), nested))).not.toThrow();
  });

  it.each([
    ['a string', 'just a string'],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
  ])('passes %s through unchanged', (_description, value) => {
    expect(serializeError(value)).toBe(value);
  });

  it('serializes a non-Error object thrown by hand', () => {
    expect(serializeError({ code: 'WEIRD' })).toMatchObject({ code: 'WEIRD' });
  });
});
