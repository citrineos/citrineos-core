// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP2_0_1, OCPPVersion, OCPP_CallAction } from '@citrineos/types';
import { SetNetworkProfileEndpoint } from '@/apis/ocpp/2/configuration/set-network-profile-endpoint.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

describe('SetNetworkProfileEndpoint', () => {
  const MOCK_STATION_ID_1 = 'Station01';
  const MOCK_STATION_ID_2 = 'Station02';
  const MOCK_TENANT_ID = DEFAULT_TENANT_ID;
  const MOCK_CORRELATION_ID = 'test-correlation-id';
  const MOCK_WEBSOCKET_SERVER_CONFIG_ID = 'ws-config-1';

  const mockRequest: OCPP2_0_1.SetNetworkProfileRequest = {
    configurationSlot: 1,
    connectionData: {
      ocppVersion: OCPP2_0_1.OCPPVersionEnumType.OCPP20,
      ocppTransport: OCPP2_0_1.OCPPTransportEnumType.JSON,
      ocppCsmsUrl: 'ws://example.com',
      messageTimeout: 30,
      securityProfile: 1,
      ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType.Wired0,
    },
  };

  const { container } = createTestContainer();
  let endpoint: SetNetworkProfileEndpoint;
  let mockSendCall: ReturnType<typeof vi.fn>;
  let mockPrepareSetNetworkProfile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSendCall = vi.fn().mockResolvedValue({ success: true, payload: 'OK' });
    mockPrepareSetNetworkProfile = vi.fn().mockResolvedValue(MOCK_CORRELATION_ID);

    endpoint = getTestInstance(container, SetNetworkProfileEndpoint, {
      ocppSender: { sendCall: mockSendCall },
      networkProfileService: { prepareSetNetworkProfile: mockPrepareSetNetworkProfile },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes the websocketServerConfigId through when extraQueries is present', async () => {
    await endpoint.handle(
      [MOCK_STATION_ID_1],
      mockRequest,
      undefined,
      MOCK_TENANT_ID,
      OCPPVersion.OCPP2_0_1,
      { websocketServerConfigId: MOCK_WEBSOCKET_SERVER_CONFIG_ID },
    );

    expect(mockPrepareSetNetworkProfile).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      [MOCK_STATION_ID_1],
      mockRequest,
      {
        websocketServerConfigId: MOCK_WEBSOCKET_SERVER_CONFIG_ID,
      },
    );
  });

  it('passes every identifier to the service in one call', async () => {
    await endpoint.handle(
      [MOCK_STATION_ID_1, MOCK_STATION_ID_2],
      mockRequest,
      undefined,
      MOCK_TENANT_ID,
      OCPPVersion.OCPP2_0_1,
      { websocketServerConfigId: MOCK_WEBSOCKET_SERVER_CONFIG_ID },
    );

    expect(mockPrepareSetNetworkProfile).toHaveBeenCalledTimes(1);
    expect(mockPrepareSetNetworkProfile).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      [MOCK_STATION_ID_1, MOCK_STATION_ID_2],
      mockRequest,
      expect.anything(),
    );
  });

  it('asks for no persistence when extraQueries is undefined', async () => {
    await endpoint.handle(
      [MOCK_STATION_ID_1],
      mockRequest,
      undefined,
      MOCK_TENANT_ID,
      OCPPVersion.OCPP2_0_1,
    );

    expect(mockPrepareSetNetworkProfile).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      [MOCK_STATION_ID_1],
      mockRequest,
      undefined,
    );
  });

  it('threads the correlation id the service returned into every send', async () => {
    await endpoint.handle(
      [MOCK_STATION_ID_1, MOCK_STATION_ID_2],
      mockRequest,
      undefined,
      MOCK_TENANT_ID,
      OCPPVersion.OCPP2_0_1,
    );

    expect(mockSendCall).toHaveBeenCalledTimes(2);
    for (const ocppConnectionName of [MOCK_STATION_ID_1, MOCK_STATION_ID_2]) {
      expect(mockSendCall).toHaveBeenCalledWith({
        ocppConnectionName,
        tenantId: MOCK_TENANT_ID,
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.SetNetworkProfile,
        eventGroup: EventGroup.Configuration,
        payload: mockRequest,
        callbackUrl: undefined,
        correlationId: MOCK_CORRELATION_ID,
      });
    }
  });
});
