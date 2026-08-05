// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// ============================================================================
import { randomUUID } from 'node:crypto';
let _seq = 0;
export function nextSeq(): number {
  return ++_seq;
}
export function uuid(): string {
  return randomUUID();
}
export function exchangeId(seq: number): string {
  return `${seq}-${uuid()}`;
}
export function resetIds(): void {
  _seq = 0;
}
