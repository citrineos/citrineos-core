// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthorizationRepository } from '@repositories/authorization.repository';
import {
  AuthorizationMapper,
  IdTagInfoDto16,
  IdTokenInfoDto,
} from '@mappers/evdriver/authorization.mapper';
import {
  AUTHORIZERS,
  AuthorizationContext,
  Authorizer,
} from '@modules/evdriver/authorizers/authorizer.token';
import { IdTokenType } from '@dto/shared/id-token.dto';
import { AuthorizationStatusEnumType } from '@enums/authorization-status.enum';
import { IdTagInfoStatusEnum16 } from '@enums/id-tag-status-16.enum';
import { IdTokenEnumType } from '@enums/id-token.enum';

/** Re-export the wire DTOs so existing imports from the service path keep working. */
export type IdTokenInfo = IdTokenInfoDto;
export type IdTagInfo16 = IdTagInfoDto16;

/**
 * Single source of truth for token-based authorization across both OCPP
 * versions. Handlers call into this service rather than the repository
 * directly so future cert-chain validation, EVSE-restriction checks, and
 * the real-time authorizer plugin chain can land in one place.
 *
 * The chain is wired by NestJS DI: every provider that implements
 * `Authorizer` and is bound to the `AUTHORIZERS` token contributes one
 * step. `DatabaseAuthorizer` is the default head; `RealTimeAuthorizer`
 * is appended when a token row carries a `realTimeAuthUrl`.
 *
 * Chain semantics (mirrors legacy `RealTimeAuthorizer` orchestration):
 *   1. Each authorizer is given the current candidate decision.
 *   2. Returning `null` abstains; the chain continues with the prior
 *      decision unchanged.
 *   3. Returning a non-Accepted status halts the chain (first non-Accepted
 *      wins).
 *   4. If every authorizer abstains or returns Accepted, the last
 *      Accepted decision is the final answer.
 */
@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(
    private readonly authRepo: AuthorizationRepository,
    @Inject(AUTHORIZERS) private readonly authorizers: Authorizer[],
  ) {}

  /** Optional location context — populated by handlers that know it. */
  private buildContext(
    tenantId: number,
    idToken: IdTokenType,
    location?: Pick<AuthorizationContext, 'stationId' | 'evseId' | 'connectorId'>,
  ): AuthorizationContext {
    return { tenantId, idToken, ...location };
  }

  /** OCPP 2.0.1 / 2.1 Authorize. */
  async authorize(
    tenantId: number,
    idToken: IdTokenType,
    location?: Pick<AuthorizationContext, 'stationId' | 'evseId' | 'connectorId'>,
  ): Promise<IdTokenInfoDto> {
    if (idToken.type === IdTokenEnumType.NoAuthorization) {
      return { status: AuthorizationStatusEnumType.Accepted };
    }

    const auth = await this.authRepo.findByIdToken(tenantId, idToken.idToken, idToken.type);
    if (!auth) {
      return { status: AuthorizationStatusEnumType.Unknown };
    }

    const context = this.buildContext(tenantId, idToken, location);
    let decision: IdTokenInfoDto = AuthorizationMapper.toIdTokenInfo(auth);

    for (const authorizer of this.authorizers) {
      const next = await authorizer.authorize(auth, decision, context);
      if (next === null) continue;
      decision = next;
      if (decision.status !== AuthorizationStatusEnumType.Accepted) {
        this.logger.debug(
          `Authorizer ${authorizer.name} halted chain with status=${decision.status}`,
        );
        break;
      }
    }
    return decision;
  }

  /**
   * OCPP 1.6 Authorize / StartTransaction id-tag check. 1.6 has no
   * `idTokenType` on the wire, so we match on `idToken` alone. The chain
   * still runs — RealTime / EVSE-restriction authorization work regardless
   * of protocol.
   */
  async authorize16(
    tenantId: number,
    idTag: string,
    location?: Pick<AuthorizationContext, 'stationId' | 'evseId' | 'connectorId'>,
  ): Promise<IdTagInfoDto16> {
    const auth = await this.authRepo.findByIdTokenAnyType(tenantId, idTag);
    if (!auth) {
      return { status: IdTagInfoStatusEnum16.Invalid };
    }

    const groupAuth = auth.groupAuthorizationId
      ? await this.authRepo.findById(tenantId, auth.groupAuthorizationId)
      : null;

    if (auth.cacheExpiryDateTime && new Date() > new Date(auth.cacheExpiryDateTime)) {
      return {
        status: IdTagInfoStatusEnum16.Expired,
        expiryDate: auth.cacheExpiryDateTime.toISOString(),
        ...(groupAuth && { parentIdTag: groupAuth.idToken }),
      };
    }

    // Run the same chain as 2.0.1, then downgrade the final status to 1.6.
    const synthetic: IdTokenType = { idToken: idTag, type: auth.idTokenType as IdTokenEnumType };
    const context = this.buildContext(tenantId, synthetic, location);
    let decision: IdTokenInfoDto = AuthorizationMapper.toIdTokenInfo(auth, groupAuth);
    for (const authorizer of this.authorizers) {
      const next = await authorizer.authorize(auth, decision, context);
      if (next === null) continue;
      decision = next;
      if (decision.status !== AuthorizationStatusEnumType.Accepted) break;
    }

    return {
      status: AuthorizationMapper.toIdTagStatus16(decision.status),
      ...(auth.cacheExpiryDateTime && {
        expiryDate: auth.cacheExpiryDateTime.toISOString(),
      }),
      ...(groupAuth && { parentIdTag: groupAuth.idToken }),
    };
  }
}
