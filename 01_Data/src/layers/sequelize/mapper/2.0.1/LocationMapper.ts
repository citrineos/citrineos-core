// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorStatusEnumType } from '@citrineos/base';
import { ConnectorStatusEnum, OCPP2_0_1 } from '@citrineos/base';

export class LocationMapper {
  static mapConnectorStatus(status: OCPP2_0_1.ConnectorStatusEnumType): ConnectorStatusEnumType {
    switch (status) {
      case OCPP2_0_1.ConnectorStatusEnumType.Available:
        return ConnectorStatusEnum.Available;
      case OCPP2_0_1.ConnectorStatusEnumType.Occupied:
        return ConnectorStatusEnum.Occupied;
      case OCPP2_0_1.ConnectorStatusEnumType.Reserved:
        return ConnectorStatusEnum.Reserved;
      case OCPP2_0_1.ConnectorStatusEnumType.Unavailable:
        return ConnectorStatusEnum.Unavailable;
      case OCPP2_0_1.ConnectorStatusEnumType.Faulted:
        return ConnectorStatusEnum.Faulted;
      default:
        return ConnectorStatusEnum.Unknown;
    }
  }
}
