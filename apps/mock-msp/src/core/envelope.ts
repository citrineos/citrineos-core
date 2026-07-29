// ============================================================================
// FILE: apps/mock-msp/src/core/envelope.ts   (FROZEN)
// ============================================================================
import {
  buildOcpiResponse,
  buildOcpiEmptyResponse,
  OcpiResponseStatusCode as SC,
} from '../ocpi/barrel.js';
// OcpiResponseStatusCode is imported as a value under the alias `SC`; re-import
// the same enum's TYPE side here so the `error()` param annotation resolves
// under verbatimModuleSyntax (barrel re-exports it as a value enum).
import type { OcpiResponseStatusCode } from '../ocpi/barrel.js';
import type { OcpiReply } from './types.js';

export function ok(data?: unknown, status_message?: string): OcpiReply {
  return { statusCode: SC.GenericSuccessCode, data, status_message, httpStatus: 200 };
}
export function empty(status_message?: string): OcpiReply {
  return { statusCode: SC.GenericSuccessCode, status_message, httpStatus: 200, empty: true };
}
export function error(
  code: OcpiResponseStatusCode,
  status_message?: string,
  httpStatus = 200,
): OcpiReply {
  return { statusCode: code, status_message, httpStatus };
}
// Turn an OcpiReply into the actual wire body using the reused ocpi-base builders.
// empty:true => buildOcpiEmptyResponse (data OMITTED — OcpiEmptyResponseSchema is z.undefined()).
export function buildBody(reply: OcpiReply): unknown {
  if (reply.empty) return buildOcpiEmptyResponse(reply.statusCode);
  return buildOcpiResponse(reply.statusCode, reply.data, reply.status_message);
}
