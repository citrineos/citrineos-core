// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AuthorizationStatusEnum, OCPP1_6 } from '@citrineos/base';
import type { AuthorizationStatusEnumType } from '@citrineos/base';
import type { Authorization } from '../../model/Authorization/Authorization.js';
import type { LocalListAuthorization } from '../../model/Authorization/LocalListAuthorization.js';

export type Ocpp16AuthorizationData = NonNullable<
  OCPP1_6.SendLocalListRequest['localAuthorizationList']
>[number];

export class LocalAuthListMapper {
  static toIdTagStatus(
    status: AuthorizationStatusEnumType | undefined,
  ): OCPP1_6.SendLocalListRequestStatus {
    switch (status) {
      case AuthorizationStatusEnum.Accepted:
      case undefined:
        return OCPP1_6.SendLocalListRequestStatus.Accepted;
      case AuthorizationStatusEnum.Blocked:
        return OCPP1_6.SendLocalListRequestStatus.Blocked;
      case AuthorizationStatusEnum.Expired:
        return OCPP1_6.SendLocalListRequestStatus.Expired;
      case AuthorizationStatusEnum.ConcurrentTx:
        return OCPP1_6.SendLocalListRequestStatus.ConcurrentTx;
      default:
        return OCPP1_6.SendLocalListRequestStatus.Invalid;
    }
  }

  static fromIdTagStatus(status: OCPP1_6.SendLocalListRequestStatus): AuthorizationStatusEnumType {
    switch (status) {
      case OCPP1_6.SendLocalListRequestStatus.Accepted:
        return AuthorizationStatusEnum.Accepted;
      case OCPP1_6.SendLocalListRequestStatus.Blocked:
        return AuthorizationStatusEnum.Blocked;
      case OCPP1_6.SendLocalListRequestStatus.Expired:
        return AuthorizationStatusEnum.Expired;
      case OCPP1_6.SendLocalListRequestStatus.ConcurrentTx:
        return AuthorizationStatusEnum.ConcurrentTx;
      case OCPP1_6.SendLocalListRequestStatus.Invalid:
      default:
        return AuthorizationStatusEnum.Invalid;
    }
  }

  /**
   * Build a 1.6 AuthorizationData entry for an authorization row.
   * Mirrors STEVE OcppTagService.getAuthData semantics.
   */
  static toOcpp16AuthorizationData(
    auth: Authorization,
    parentIdTag?: string | null,
  ): Ocpp16AuthorizationData {
    return {
      idTag: auth.idToken,
      idTagInfo: {
        status: LocalAuthListMapper.toIdTagStatus(auth.status),
        expiryDate: auth.cacheExpiryDateTime ?? undefined,
        parentIdTag: parentIdTag ?? undefined,
      },
    };
  }

  /**
   * Build a 1.6 AuthorizationData entry from a persisted LocalListAuthorization row.
   */
  static toOcpp16AuthorizationDataFromLocal(
    local: LocalListAuthorization,
    parentIdTag?: string | null,
  ): Ocpp16AuthorizationData {
    return {
      idTag: local.idToken,
      idTagInfo: {
        status: LocalAuthListMapper.toIdTagStatus(
          local.status as AuthorizationStatusEnumType | undefined,
        ),
        expiryDate: local.cacheExpiryDateTime ?? undefined,
        parentIdTag: parentIdTag ?? undefined,
      },
    };
  }
}
