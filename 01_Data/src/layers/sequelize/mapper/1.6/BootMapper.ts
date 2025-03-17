// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6 } from '@citrineos/base';

export class BootMapper {
  static toRegistrationStatusEnumType(status: string): OCPP1_6.BootNotificationResponseStatus {
    switch (status) {
      case 'Accepted':
        return OCPP1_6.BootNotificationResponseStatus.Accepted;
      case 'Pending':
        return OCPP1_6.BootNotificationResponseStatus.Pending;
      case 'Rejected':
        return OCPP1_6.BootNotificationResponseStatus.Rejected;
      default:
        throw new Error(`Invalid status: ${status}`);
    }
  }
}
