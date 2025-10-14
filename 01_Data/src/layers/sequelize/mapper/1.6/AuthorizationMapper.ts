// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AuthorizationStatusType, OCPP1_6 } from '@citrineos/base';

export class AuthorizationMapper {
  static toIdTagInfoStatus(status: AuthorizationStatusType): OCPP1_6.AuthorizeResponseStatus {
    switch (status) {
      case AuthorizationStatusType.Accepted:
        return OCPP1_6.AuthorizeResponseStatus.Accepted;
      case AuthorizationStatusType.Blocked:
        return OCPP1_6.AuthorizeResponseStatus.Blocked;
      case AuthorizationStatusType.Expired:
        return OCPP1_6.AuthorizeResponseStatus.Expired;
      case AuthorizationStatusType.Invalid:
        return OCPP1_6.AuthorizeResponseStatus.Invalid;
      default:
        throw new Error('Unknown IdTagInfoStatus status');
    }
  }

  static toStartTransactionResponseStatus(
    status: AuthorizationStatusType,
  ): OCPP1_6.StartTransactionResponseStatus {
    switch (status) {
      case AuthorizationStatusType.Accepted:
        return OCPP1_6.StartTransactionResponseStatus.Accepted;
      case AuthorizationStatusType.Blocked:
        return OCPP1_6.StartTransactionResponseStatus.Blocked;
      case AuthorizationStatusType.ConcurrentTx:
        return OCPP1_6.StartTransactionResponseStatus.ConcurrentTx;
      case AuthorizationStatusType.Expired:
        return OCPP1_6.StartTransactionResponseStatus.Expired;
      case AuthorizationStatusType.Invalid:
        return OCPP1_6.StartTransactionResponseStatus.Invalid;
      default:
        throw new Error('Unknown StartTransactionResponse status');
    }
  }
}
