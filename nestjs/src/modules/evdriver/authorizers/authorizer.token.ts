// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Authorization } from '@entities/authorization.entity';
import { IdTokenType } from '@dto/shared/id-token.dto';
import { IdTokenInfoDto } from '@mappers/evdriver/authorization.mapper';

/**
 * Multi-injection token (`@Inject(AUTHORIZERS) authorizers: Authorizer[]`).
 *
 * Authorizers run as a chain inside `AuthorizationService`. Mirrors the
 * legacy `IAuthorizer` plugin pattern from `core/src/util/authorizer/`,
 * where each authorizer can refine the decision a previous step produced.
 */
export const AUTHORIZERS = Symbol('AUTHORIZERS');

export interface AuthorizationContext {
  tenantId: number;
  stationId?: string;
  evseId?: number;
  connectorId?: number;
  /** Original wire token. */
  idToken: IdTokenType;
}

/**
 * One link in the authorization chain.
 *
 * Each authorizer is given the current candidate `decision` (built by the
 * previous step or the initial DB lookup) plus the resolved `Authorization`
 * row. It can:
 *   - return `null` to abstain (chain continues with the same decision), or
 *   - return a new `IdTokenInfoDto` to override.
 *
 * Conventionally only `Accepted` decisions are passed through to subsequent
 * authorizers — once any link returns a non-Accepted status the orchestrator
 * halts and returns it. This matches the legacy semantic.
 */
export interface Authorizer {
  /** Stable name used for log lines and metrics. */
  readonly name: string;
  authorize(
    auth: Authorization,
    decision: IdTokenInfoDto,
    context: AuthorizationContext,
  ): Promise<IdTokenInfoDto | null>;
}
