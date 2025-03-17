// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';

export class BootMapper {
  static toRegistrationStatusEnumType(status: string): OCPP2_0_1.RegistrationStatusEnumType {
    switch (status) {
      case 'Accepted':
        return OCPP2_0_1.RegistrationStatusEnumType.Accepted;
      case 'Pending':
        return OCPP2_0_1.RegistrationStatusEnumType.Pending;
      case 'Rejected':
        return OCPP2_0_1.RegistrationStatusEnumType.Rejected;
      default:
        throw new Error(`Invalid status: ${status}`);
    }
  }

  static toStatusInfo(statusInfo?: any): any {
    if (!statusInfo) {
      return statusInfo;
    }
    return {
      customData: statusInfo.customData,
      reasonCode: statusInfo.reasonCode,
      additionalInfo: statusInfo.additionalInfo,
    };
  }
}
