// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type AuthorizationStatusEnumType,
  AuthorizationStatusEnum,
  OCPP1_6,
} from '@citrineos/types';

export class AuthorizationMapper {
  static toIdTagInfoStatus(status: AuthorizationStatusEnumType): OCPP1_6.AuthorizeResponseStatus {
    switch (status) {
      case AuthorizationStatusEnum.Accepted:
        return OCPP1_6.AuthorizeResponseStatus.Accepted;
      case AuthorizationStatusEnum.Blocked:
        return OCPP1_6.AuthorizeResponseStatus.Blocked;
      case AuthorizationStatusEnum.ConcurrentTx:
        return OCPP1_6.AuthorizeResponseStatus.ConcurrentTx;
      case AuthorizationStatusEnum.Expired:
        return OCPP1_6.AuthorizeResponseStatus.Expired;
      case AuthorizationStatusEnum.Invalid:
        return OCPP1_6.AuthorizeResponseStatus.Invalid;
      default:
        console.warn(`Unsupported OCPP 1.6 authorization status: ${status}`);
        return OCPP1_6.AuthorizeResponseStatus.Invalid;
    }
  }

  static toStartTransactionResponseStatus(
    status: AuthorizationStatusEnumType,
  ): OCPP1_6.StartTransactionResponseStatus {
    switch (status) {
      case AuthorizationStatusEnum.Accepted:
        return OCPP1_6.StartTransactionResponseStatus.Accepted;
      case AuthorizationStatusEnum.Blocked:
        return OCPP1_6.StartTransactionResponseStatus.Blocked;
      case AuthorizationStatusEnum.ConcurrentTx:
        return OCPP1_6.StartTransactionResponseStatus.ConcurrentTx;
      case AuthorizationStatusEnum.Expired:
        return OCPP1_6.StartTransactionResponseStatus.Expired;
      case AuthorizationStatusEnum.Invalid:
        return OCPP1_6.StartTransactionResponseStatus.Invalid;
      default:
        throw new Error('Unknown StartTransactionResponse status');
    }
  }
}
