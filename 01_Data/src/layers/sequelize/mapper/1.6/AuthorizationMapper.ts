// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AuthorizationStatusEnumType } from '@citrineos/base';
import { AuthorizationStatusEnum, OCPP1_6 } from '@citrineos/base';

export class AuthorizationMapper {
  static toIdTagInfoStatus(status: AuthorizationStatusEnumType): OCPP1_6.AuthorizeResponseStatus {
    switch (status) {
      case AuthorizationStatusEnum.Accepted:
        return OCPP1_6.AuthorizeResponseStatus.Accepted;
      case AuthorizationStatusEnum.Blocked:
        return OCPP1_6.AuthorizeResponseStatus.Blocked;
      case AuthorizationStatusEnum.Expired:
        return OCPP1_6.AuthorizeResponseStatus.Expired;
      case AuthorizationStatusEnum.Invalid:
        return OCPP1_6.AuthorizeResponseStatus.Invalid;
      default:
        throw new Error('Unknown IdTagInfoStatus status');
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
