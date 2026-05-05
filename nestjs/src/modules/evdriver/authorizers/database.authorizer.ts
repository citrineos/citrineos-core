// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { Authorization } from '@entities/authorization.entity';
import { AuthorizationStatusEnumType } from '@enums/authorization-status.enum';
import { AuthorizationMapper, IdTokenInfoDto } from '@mappers/evdriver/authorization.mapper';
import { AuthorizationContext, Authorizer } from '@modules/evdriver/authorizers/authorizer.token';
import { AuthorizationRepository } from '@repositories/authorization.repository';

/**
 * The default authorizer — pure DB lookup + cache-expiry check, no
 * external I/O. Always runs first in the chain. Mirrors the legacy
 * fallback path that lived inline in `OCPP201_EVDriver._handleAuthorize`.
 *
 * When the row points at a group via `groupAuthorizationId`, the parent
 * row is fetched so the response can carry `groupIdToken: { idToken, type }`.
 */
@Injectable()
export class DatabaseAuthorizer implements Authorizer {
  readonly name = 'database';

  constructor(private readonly authRepo: AuthorizationRepository) {}

  async authorize(
    auth: Authorization,
    _decision: IdTokenInfoDto,
    context: AuthorizationContext,
  ): Promise<IdTokenInfoDto | null> {
    const groupAuth = auth.groupAuthorizationId
      ? await this.authRepo.findById(context.tenantId, auth.groupAuthorizationId)
      : null;
    if (auth.cacheExpiryDateTime && new Date() > new Date(auth.cacheExpiryDateTime)) {
      return {
        status: AuthorizationStatusEnumType.Invalid,
        ...(groupAuth && {
          groupIdToken: { idToken: groupAuth.idToken, type: groupAuth.idTokenType },
        }),
      };
    }
    return AuthorizationMapper.toIdTokenInfo(auth, groupAuth);
  }
}
