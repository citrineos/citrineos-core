// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { assert, describe, it } from 'vitest';
import { getBatches } from '../../src';

describe('getBatches', () => {
  it('splits array into batches of given positive size', () => {
    const input = [1, 2, 3, 4, 5];
    const result = getBatches(input, 2);

    assert.strictEqual(result.size, 3);
    assert.deepStrictEqual(result.get(0), [1, 2]);
    assert.deepStrictEqual(result.get(2), [3, 4]);
    assert.deepStrictEqual(result.get(4), [5]);
  });

  it('returns single batch when size is larger than array length', () => {
    const input = [1, 2, 3];
    const result = getBatches(input, 10);

    assert.strictEqual(result.size, 1);
    assert.deepStrictEqual(result.get(0), [1, 2, 3]);
  });

  it('returns empty map for empty array', () => {
    const input: number[] = [];
    const result = getBatches(input, 3);

    assert.strictEqual(result.size, 0);
  });

  it('defaults to full length when size is 0', () => {
    const input = [1, 2, 3];
    const result = getBatches(input, 0);

    // size normalized to input.length => one batch with all elements
    assert.strictEqual(result.size, 1);
    assert.deepStrictEqual(result.get(0), [1, 2, 3]);
  });

  it('defaults to full length when size is negative', () => {
    const input = [1, 2, 3];
    const result = getBatches(input, -5);

    assert.strictEqual(result.size, 1);
    assert.deepStrictEqual(result.get(0), [1, 2, 3]);
  });

  it('defaults to full length when size is non-integer', () => {
    const input = [1, 2, 3];
    const result = getBatches(input, 2.5);

    assert.strictEqual(result.size, 1);
    assert.deepStrictEqual(result.get(0), [1, 2, 3]);
  });
});
