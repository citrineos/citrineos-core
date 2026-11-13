// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

/**
 * Why an attempt ended with the status it did. The first group covers idTokens the CSMS evaluated
 * itself; the second covers remote starts, where the station decides and the CSMS only records
 * what came back.
 *
 * - **StoredStatus** — the Authorization's own status was not Accepted, or it had none.
 * - **AuthorizerRejected** — the stored status was Accepted and an authorizer in the chain (e.g.
 *   real-time auth) turned it down.
 * - **CertificateRejected** — a contract certificate presented with the token was not accepted.
 * - **NoAuthorization** — a NoAuthorization idToken, accepted without a lookup.
 * - **Error** — evaluating the token, or acting on an accepted one, failed.
 * - **StationResponded** — the station answered a remote start; its answer is the response status.
 * - **NotDelivered** — the CSMS gave up on the remote start before it reached the station.
 */
export const AuthorizationAttemptReasonSchema = z.enum([
  'Accepted',
  'NotFound',
  'MultipleFound',
  'StoredStatus',
  'CacheExpired',
  'ConcurrentTx',
  'NotAllowedTypeEVSE',
  'NotAtThisLocation',
  'AuthorizerRejected',
  'NoCredit',
  'CertificateRejected',
  'InvalidTokenFormat',
  'NoAuthorization',
  'Error',
  'StationResponded',
  'CallError',
  'Timeout',
  'SendFailed',
  'NotDelivered',
]);

export const AuthorizationAttemptReasonEnum = AuthorizationAttemptReasonSchema.enum;

export type AuthorizationAttemptReason = z.infer<typeof AuthorizationAttemptReasonSchema>;
