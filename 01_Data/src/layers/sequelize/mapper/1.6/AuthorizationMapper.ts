/*
 * // Copyright Contributors to the CitrineOS Project
 * //
 * // SPDX-License-Identifier: Apache 2.0
 *
 */

import {
  OCPP1_6,
} from '@citrineos/base';

export class AuthorizationMapper {


  static toIdTagInfoStatus(status: string): OCPP1_6.AuthorizeResponseStatus {
    switch (status) {
      case "Accepted":
        return OCPP1_6.AuthorizeResponseStatus.Accepted;
      case "Blocked":
        return OCPP1_6.AuthorizeResponseStatus.Blocked;
      case "Expired":
        return OCPP1_6.AuthorizeResponseStatus.Expired;
      case "Invalid":
        return OCPP1_6.AuthorizeResponseStatus.Invalid;
      default:
        throw new Error('Unknown IdTagInfoStatus status');
    }
  }
}
