// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ConnectorStatus, OCPP2_0_1 } from '@citrineos/base';

export class LocationMapper {
  static mapConnectorStatus(status: OCPP2_0_1.ConnectorStatusEnumType): ConnectorStatus {
    switch (status) {
      case OCPP2_0_1.ConnectorStatusEnumType.Available:
        return ConnectorStatus.Available;
      case OCPP2_0_1.ConnectorStatusEnumType.Occupied:
        return ConnectorStatus.Charging;
      case OCPP2_0_1.ConnectorStatusEnumType.Reserved:
        return ConnectorStatus.Reserved;
      case OCPP2_0_1.ConnectorStatusEnumType.Unavailable:
        return ConnectorStatus.Unavailable;
      case OCPP2_0_1.ConnectorStatusEnumType.Faulted:
        return ConnectorStatus.Faulted;
      default:
        return ConnectorStatus.Unknown;
    }
  }
}
