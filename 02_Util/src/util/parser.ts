// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OcppRequest } from '@citrineos/base';

/**
 * Calculate the size of a request.
 *
 * @param {object} request - The ocpp request.
 * @return {number} The size of the request (Bytes).
 */
export function getSizeOfRequest(request: OcppRequest): number {
  return new TextEncoder().encode(JSON.stringify(request)).length;
}

/**
 * Slice array into pieces according to the given size.
 *
 * @param {array} array - An array.
 * @param {number} size - The expected size of a batch.
 * @return {map} A map with index as key and batch as value. Index is the position of the 1st batch element in the given
 * array. Batch is a subarray of the given array.
 */
export function getBatches(
  array: object[] | string[] | boolean[] | number[],
  size: number,
): Map<number, object[] | string[] | boolean[] | number[]> {
  const batchMap = new Map();
  let lastIndex = 0;
  while (array.length > 0) {
    const batch = array.slice(0, size);
    batchMap.set(lastIndex, batch);
    lastIndex += batch.length;
    array = array.slice(size);
  }

  return batchMap;
}

/**
 * Get the number of fraction digits in a number, e.g, 1.23 -> 2
 *
 * @param num - The number to get the number of fraction digits
 * @returns The number of fraction digits
 */
export function getNumberOfFractionDigit(num: number): number {
  const numString = num.toString();
  const match = numString.match(/\.(\d+)/);

  if (!match) {
    return 0;
  } else {
    return match[1].length;
  }
}

/**
 * Convert string to set. For example, 'a,b,c' -> new Set(['a', 'b', 'c'])
 *
 * @param input - The string to convert
 * @returns Set
 */
export function stringToSet(input: string): Set<string> {
  return new Set(input.split(',').map((item) => item.trim()));
}
