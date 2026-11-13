// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ConnectorStatusEnum, OCPPVersion } from '@citrineos/types';
import { describe, expect, it } from 'vitest';
import { getConnectorStatus } from './connector-status';

const latestStatusNotification = {
  stationId: 1,
  connectorStatus: ConnectorStatusEnum.Faulted,
  connectorId: 1,
  tenantId: 1,
};

describe('getConnectorStatus', () => {
  it.each([OCPPVersion.OCPP1_6, OCPPVersion.OCPP2_0_1, null, undefined])(
    'reads the latest status notification for protocol %s',
    (protocol) => {
      expect(
        getConnectorStatus(protocol, {
          status: ConnectorStatusEnum.Available,
          latestStatusNotification,
        }),
      ).toBe(ConnectorStatusEnum.Faulted);
    },
  );

  it('has no status for 1.6 or 2.0.1 without a status notification', () => {
    expect(
      getConnectorStatus(OCPPVersion.OCPP2_0_1, {
        status: ConnectorStatusEnum.Available,
        latestStatusNotification: null,
      }),
    ).toBeUndefined();
  });

  it('reads the connector status for 2.1', () => {
    expect(
      getConnectorStatus(OCPPVersion.OCPP2_1, {
        status: ConnectorStatusEnum.Occupied,
        latestStatusNotification,
      }),
    ).toBe(ConnectorStatusEnum.Occupied);
  });

  it('has no status for a 2.1 connector that never reported one', () => {
    expect(
      getConnectorStatus(OCPPVersion.OCPP2_1, {
        status: ConnectorStatusEnum.Unknown,
        latestStatusNotification: null,
      }),
    ).toBeUndefined();
  });

  it('has no status without a connector', () => {
    expect(getConnectorStatus(OCPPVersion.OCPP2_1, undefined)).toBeUndefined();
    expect(getConnectorStatus(OCPPVersion.OCPP2_0_1, undefined)).toBeUndefined();
  });
});
