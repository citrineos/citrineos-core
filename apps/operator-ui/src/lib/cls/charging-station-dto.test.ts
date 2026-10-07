// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  ChargingStationStatusEnum,
  type ChargingStationStatusEnumType,
  ConnectorStatusEnum,
  type ConnectorStatusEnumType,
  OCPPVersion,
} from '@citrineos/types';
import { describe, expect, it } from 'vitest';
import {
  type ChargingStationStatusCountsDto,
  getChargingStationStatusCounts,
} from './charging-station-dto';

interface Reported {
  evseId?: number;
  connectorId: number;
  connectorStatus: ConnectorStatusEnumType;
}

const station = ({
  isOnline = true,
  protocol,
  evseTypeId,
  connector,
  reported,
}: {
  isOnline?: boolean;
  protocol: OCPPVersion;
  evseTypeId?: number;
  connector: { connectorId?: number; evseTypeConnectorId?: number };
  reported: Reported[];
}): ChargingStationStatusCountsDto => ({
  id: 5,
  ocppConnectionName: 'CS1',
  isOnline,
  protocol,
  evses: [
    {
      id: 7,
      stationId: 5,
      evseTypeId,
      connectors: [{ id: 3, stationId: 5, evseId: 7, ...connector }],
    },
  ],
  statusNotifications: reported.map((statusNotification, index) => ({
    statusNotificationId: index + 1,
    statusNotification,
  })),
});

const statusesWithCount = (counts: Record<ChargingStationStatusEnumType, number>) =>
  Object.entries(counts).filter(([, count]) => count > 0);

describe('getChargingStationStatusCounts', () => {
  it('matches a 2.x status by the connector number within the EVSE', () => {
    const counts = getChargingStationStatusCounts(
      station({
        protocol: OCPPVersion.OCPP2_0_1,
        evseTypeId: 2,
        connector: { connectorId: 3, evseTypeConnectorId: 1 },
        reported: [{ evseId: 2, connectorId: 1, connectorStatus: ConnectorStatusEnum.Available }],
      }),
    );
    expect(statusesWithCount(counts)).toEqual([[ChargingStationStatusEnum.AVAILABLE, 1]]);
  });

  it('does not read a 2.x status for another connector of the EVSE by its station-wide number', () => {
    const counts = getChargingStationStatusCounts(
      station({
        protocol: OCPPVersion.OCPP2_0_1,
        evseTypeId: 2,
        connector: { connectorId: 2, evseTypeConnectorId: 1 },
        reported: [
          { evseId: 2, connectorId: 1, connectorStatus: ConnectorStatusEnum.Available },
          { evseId: 2, connectorId: 2, connectorStatus: ConnectorStatusEnum.Faulted },
        ],
      }),
    );
    expect(statusesWithCount(counts)).toEqual([[ChargingStationStatusEnum.AVAILABLE, 1]]);
  });

  it('matches a 1.6 status by the station-wide connector number', () => {
    // 1.6 auto-commissioning leaves the EVSE and its connector without 2.x numbers.
    const counts = getChargingStationStatusCounts(
      station({
        protocol: OCPPVersion.OCPP1_6,
        connector: { connectorId: 1 },
        reported: [{ connectorId: 1, connectorStatus: ConnectorStatusEnum.Charging }],
      }),
    );
    expect(statusesWithCount(counts)).toEqual([[ChargingStationStatusEnum.CHARGING, 1]]);
  });

  it('counts every EVSE of an offline station as unavailable', () => {
    const counts = getChargingStationStatusCounts(
      station({
        isOnline: false,
        protocol: OCPPVersion.OCPP2_0_1,
        evseTypeId: 1,
        connector: { connectorId: 1, evseTypeConnectorId: 1 },
        reported: [{ evseId: 1, connectorId: 1, connectorStatus: ConnectorStatusEnum.Available }],
      }),
    );
    expect(statusesWithCount(counts)).toEqual([[ChargingStationStatusEnum.UNAVAILABLE, 1]]);
  });
});
