// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { Authorization } from '@entities/authorization.entity';
import { AuthorizationStatusEnumType } from '@enums/authorization-status.enum';
import { IdTokenInfoDto } from '@mappers/evdriver/authorization.mapper';
import { AuthorizationContext, Authorizer } from '@modules/evdriver/authorizers/authorizer.token';

/**
 * Per-token EVSE restrictions. Mirrors the legacy "EVSE restrictions"
 * branch in `OCPP201_EVDriver._handleAuthorize`:
 *
 *   - `disallowedEvseIdPrefixes` (varchar[]) — if the request's
 *     `stationId` starts with any of these prefixes, the token is
 *     restricted from this location.
 *   - `allowedConnectorTypes` (varchar[]) — currently a no-op since the
 *     wire payload doesn't carry connector type; kept on the row for
 *     read-side filtering and future hook-up to the Connectors entity.
 *
 * Only kicks in when the prior step in the chain returned `Accepted`
 * (legacy "first non-Accepted halts" semantic).
 */
@Injectable()
export class EvseRestrictionAuthorizer implements Authorizer {
  readonly name = 'evse-restriction';
  private readonly logger = new Logger(EvseRestrictionAuthorizer.name);

  async authorize(
    auth: Authorization,
    decision: IdTokenInfoDto,
    context: AuthorizationContext,
  ): Promise<IdTokenInfoDto | null> {
    if (decision.status !== AuthorizationStatusEnumType.Accepted) return null;

    const prefixes = (auth.disallowedEvseIdPrefixes ?? []).filter((s) => s.length > 0);
    if (prefixes.length === 0) return null;

    const stationId = context.stationId ?? '';
    const matched = prefixes.find((p) => stationId.startsWith(p));
    if (!matched) return null;

    this.logger.debug(`Token ${auth.idToken} blocked at ${stationId}: matched prefix "${matched}"`);
    return { ...decision, status: AuthorizationStatusEnumType.NotAtThisLocation };
  }
}
