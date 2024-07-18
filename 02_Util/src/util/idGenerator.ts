// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * Generates request id
 * TODO: get clear the scope and have a better way to generate unique id
 * @return {number}
 */
export function generateRequestId(): number {
  return Math.floor(Math.random() * 1000);
}
