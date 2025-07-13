/*
 * // Copyright Contributors to the CitrineOS Project
 * //
 * // SPDX-License-Identifier: Apache 2.0
 *
 */

import { AuthorizationStatusEnumType, OCPP1_6 } from '@citrineos/base';

export class AuthorizationMapper {
  static toIdTagInfoStatus(status: AuthorizationStatusEnumType): OCPP1_6.AuthorizeResponseStatus {
    switch (status) {
      case AuthorizationStatusEnumType.Accepted:
        return OCPP1_6.AuthorizeResponseStatus.Accepted;
      case AuthorizationStatusEnumType.Blocked:
        return OCPP1_6.AuthorizeResponseStatus.Blocked;
      case AuthorizationStatusEnumType.Expired:
        return OCPP1_6.AuthorizeResponseStatus.Expired;
      case AuthorizationStatusEnumType.Invalid:
        return OCPP1_6.AuthorizeResponseStatus.Invalid;
      default:
        throw new Error('Unknown IdTagInfoStatus status');
    }
  }

  static toStartTransactionResponseStatus(
    status: AuthorizationStatusEnumType,
  ): OCPP1_6.StartTransactionResponseStatus {
    switch (status) {
      case AuthorizationStatusEnumType.Accepted:
        return OCPP1_6.StartTransactionResponseStatus.Accepted;
      case AuthorizationStatusEnumType.Blocked:
        return OCPP1_6.StartTransactionResponseStatus.Blocked;
      case AuthorizationStatusEnumType.ConcurrentTx:
        return OCPP1_6.StartTransactionResponseStatus.ConcurrentTx;
      case AuthorizationStatusEnumType.Expired:
        return OCPP1_6.StartTransactionResponseStatus.Expired;
      case AuthorizationStatusEnumType.Invalid:
        return OCPP1_6.StartTransactionResponseStatus.Invalid;
      default:
        throw new Error('Unknown StartTransactionResponse status');
    }
  }
}
