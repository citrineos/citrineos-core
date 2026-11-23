// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type ChargingStationDto,
  type ConnectorDto,
  type ConnectorStatusEnumType,
  ConnectorStatusEnum,
  OCPPVersion,
} from '@citrineos/types';

export const getConnectorStatus = (
  protocol: ChargingStationDto['protocol'],
  connector: Pick<ConnectorDto, 'status' | 'latestStatusNotification'> | undefined,
): ConnectorStatusEnumType | undefined => {
  if (protocol === OCPPVersion.OCPP2_1) {
    return connector?.status === ConnectorStatusEnum.Unknown ? undefined : connector?.status;
  }
  return connector?.latestStatusNotification?.connectorStatus;
};
