// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { deepMerge } from './deep-merge';

describe('deepMerge', () => {
  it('keeps base keys that a nested section of the override lacks', () => {
    expect(
      deepMerge(
        { Tariffs: { detail: { currency: 'Currency', tariffAltText: 'Alt text' } } },
        { Tariffs: { detail: { currency: 'Moeda' } } },
      ),
    ).toEqual({ Tariffs: { detail: { currency: 'Moeda', tariffAltText: 'Alt text' } } });
  });

  it('lets the override replace leaves and add keys', () => {
    expect(deepMerge({ a: 'x', b: { c: 'y' } }, { a: 'z', b: { d: 'w' }, e: 'v' })).toEqual({
      a: 'z',
      b: { c: 'y', d: 'w' },
      e: 'v',
    });
  });

  it('does not change its inputs', () => {
    const base = { a: { b: 'x' } };
    deepMerge(base, { a: { b: 'y' } });
    expect(base).toEqual({ a: { b: 'x' } });
  });
});
