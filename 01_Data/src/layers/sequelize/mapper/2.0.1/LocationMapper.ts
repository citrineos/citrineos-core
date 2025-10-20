// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorStatus } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/base';

export class LocationMapper {
  static mapConnectorStatus(status: OCPP2_0_1.ConnectorStatusEnumType): string {
    switch (status) {
      case OCPP2_0_1.ConnectorStatusEnumType.Available:
        return 'Available';
      case OCPP2_0_1.ConnectorStatusEnumType.Occupied:
        return 'Charging';
      case OCPP2_0_1.ConnectorStatusEnumType.Reserved:
        return 'Reserved';
      case OCPP2_0_1.ConnectorStatusEnumType.Unavailable:
        return 'Unavailable';
      case OCPP2_0_1.ConnectorStatusEnumType.Faulted:
        return 'Faulted';
      default:
        return 'Unknown';
    }
  }
}
