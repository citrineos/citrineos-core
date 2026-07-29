// ============================================================================
// FILE: apps/mock-msp/src/core/ids.ts   (FROZEN)
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
