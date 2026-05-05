// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Authorization } from '@entities/authorization.entity';
import { AuthorizationStatusEnumType } from '@enums/authorization-status.enum';
import { IdTagInfoStatusEnum16 } from '@enums/id-tag-status-16.enum';

/**
 * OCPP 2.0.1 / 2.1 idTokenInfo wire shape.
 *
 * Carries the authorization decision back to the charger (Authorize response,
 * TransactionEvent.Started response, etc.).
 */
export interface IdTokenInfoDto {
  status: AuthorizationStatusEnumType;
  cacheExpiryDateTime?: string;
  groupIdToken?: { idToken: string; type: string | null };
}

/** OCPP 1.6 idTagInfo wire shape (different field names from 2.0.1). */
export interface IdTagInfoDto16 {
  status: IdTagInfoStatusEnum16;
  expiryDate?: string;
  parentIdTag?: string;
}

/**
 * Maps the `Authorization` entity to OCPP wire DTOs for both protocol
 * versions. Mirrors `OCPP2_0_1_Mapper.AuthorizationMapper` /
 * `OCPP1_6_Mapper.AuthorizationMapper` from the legacy server.
 *
 * `groupAuth` is the pre-fetched parent Authorization row (looked up by
 * the caller via `auth.groupAuthorizationId`). Inline self-FK joins
 * would force this mapper to be async; the join is cheap enough that
 * callers do it explicitly via `AuthorizationRepository.findById` when
 * they need the `groupIdToken` field on the response.
 */
export class AuthorizationMapper {
  /** OCPP 2.0.1 / 2.1: build idTokenInfo from a stored Authorization row. */
  static toIdTokenInfo(auth: Authorization, groupAuth?: Authorization | null): IdTokenInfoDto {
    return {
      status: (auth.status as AuthorizationStatusEnumType) ?? AuthorizationStatusEnumType.Unknown,
      ...(auth.cacheExpiryDateTime && {
        cacheExpiryDateTime: auth.cacheExpiryDateTime.toISOString(),
      }),
      ...(groupAuth && {
        groupIdToken: { idToken: groupAuth.idToken, type: groupAuth.idTokenType },
      }),
    };
  }

  /** OCPP 1.6: build idTagInfo from a stored Authorization row. */
  static toIdTagInfo16(auth: Authorization, groupAuth?: Authorization | null): IdTagInfoDto16 {
    return {
      status: AuthorizationMapper.toIdTagStatus16(auth.status),
      ...(auth.cacheExpiryDateTime && { expiryDate: auth.cacheExpiryDateTime.toISOString() }),
      ...(groupAuth && { parentIdTag: groupAuth.idToken }),
    };
  }

  /**
   * 2.0.1 → 1.6 status downgrade. Values in 2.0.1 not present in 1.6
   * (NoCredit, NotAllowedTypeEVSE, NotAtThisLocation, NotAtThisTime,
   * Unknown) collapse to `Invalid` per the spec semantics — the charger
   * just sees "you can't charge" which is the same as Invalid for
   * non-version-aware downstream clients.
   */
  static toIdTagStatus16(status: string | null | undefined): IdTagInfoStatusEnum16 {
    switch (status as AuthorizationStatusEnumType) {
      case AuthorizationStatusEnumType.Accepted:
        return IdTagInfoStatusEnum16.Accepted;
      case AuthorizationStatusEnumType.Blocked:
        return IdTagInfoStatusEnum16.Blocked;
      case AuthorizationStatusEnumType.Expired:
        return IdTagInfoStatusEnum16.Expired;
      case AuthorizationStatusEnumType.Invalid:
        return IdTagInfoStatusEnum16.Invalid;
      case AuthorizationStatusEnumType.ConcurrentTx:
        return IdTagInfoStatusEnum16.ConcurrentTx;
      default:
        return IdTagInfoStatusEnum16.Invalid;
    }
  }
}
