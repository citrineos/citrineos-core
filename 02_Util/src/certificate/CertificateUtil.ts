// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export function createPemBlock(type: string, content: string) {
  return `-----BEGIN ${type}-----\n${content}\n-----END ${type}-----\n`;
}
