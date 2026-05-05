// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { Authorization } from '@entities/authorization.entity';
import { AuthorizationStatusEnumType } from '@enums/authorization-status.enum';
import { IdTokenInfoDto } from '@mappers/evdriver/authorization.mapper';
import { AuthorizationContext, Authorizer } from '@modules/evdriver/authorizers/authorizer.token';

interface RealTimeAuthorizationResponse {
  data: {
    allowed: 'ALLOWED' | 'BLOCKED' | 'EXPIRED' | 'NO_CREDIT' | 'NOT_ALLOWED';
    reason?: string;
  };
}

/**
 * Real-time authorizer — POSTs to the per-token `realTimeAuthUrl` and lets
 * the upstream system override an Accepted decision (e.g. "no credit").
 * Mirrors `core/src/util/authorizer/RealTimeAuthorizer.ts`.
 *
 * Only kicks in when:
 *   - the previous step in the chain returned `Accepted`, AND
 *   - the auth row has a `realTimeAuthUrl` configured.
 *
 * Network or parse failures fall back to the previous decision unless the
 * row was explicitly configured `realTimeAuth = AllowedOffline` (matches
 * legacy fail-open semantics).
 */
@Injectable()
export class RealTimeAuthorizer implements Authorizer {
  readonly name = 'real-time';
  private readonly logger = new Logger(RealTimeAuthorizer.name);

  async authorize(
    auth: Authorization,
    decision: IdTokenInfoDto,
    _context: AuthorizationContext,
  ): Promise<IdTokenInfoDto | null> {
    if (decision.status !== AuthorizationStatusEnumType.Accepted) return null;
    if (!auth.realTimeAuthUrl) return null;
    const url = auth.realTimeAuthUrl;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: auth.tenantId,
          idToken: auth.idToken,
          idTokenType: auth.idTokenType,
        }),
      });
      const json = (await response.json()) as RealTimeAuthorizationResponse;
      const status = this.mapAllowed(json?.data?.allowed);
      if (!status) return null;
      return { ...decision, status };
    } catch (err) {
      this.logger.warn(`Real-time auth call failed for ${auth.idToken}: ${(err as Error).message}`);
      return null;
    }
  }

  private mapAllowed(allowed: string | undefined): AuthorizationStatusEnumType | null {
    switch (allowed) {
      case 'ALLOWED':
        return AuthorizationStatusEnumType.Accepted;
      case 'BLOCKED':
        return AuthorizationStatusEnumType.Blocked;
      case 'EXPIRED':
        return AuthorizationStatusEnumType.Expired;
      case 'NO_CREDIT':
        return AuthorizationStatusEnumType.NoCredit;
      case 'NOT_ALLOWED':
        return AuthorizationStatusEnumType.NotAtThisLocation;
      default:
        return null;
    }
  }
}
