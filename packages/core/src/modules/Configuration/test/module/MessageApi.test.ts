// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SetNetworkProfile } from '@dal/index.js';
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPPVersion, OCPP_CallAction } from '@citrineos/base';
import { ConfigurationOcpp2Api } from '../../src/module/2/MessageApi.js';

vi.mock('uuid', () => ({
  v4: () => 'test-correlation-id',
}));

describe('ConfigurationOcpp2Api', () => {
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

  let api: ConfigurationOcpp2Api;
  let mockSendCall: ReturnType<typeof vi.fn>;
  let mockSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSave = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(SetNetworkProfile, 'build').mockReturnValue({
      save: mockSave,
    } as any);

    mockSendCall = vi.fn().mockResolvedValue({ success: true, payload: 'OK' });

    api = {
      _module: {
        sendCall: mockSendCall,
      },
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setNetworkProfile', () => {
    it('should pass individual ocppConnectionName string to SetNetworkProfile.build for a single identifier', async () => {
      const extraQueries = { websocketServerConfigId: MOCK_WEBSOCKET_SERVER_CONFIG_ID };

      await ConfigurationOcpp2Api.prototype.setNetworkProfile.call(
        api,
        [MOCK_STATION_ID_1],
        mockRequest,
        undefined,
        MOCK_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
        extraQueries,
      );

      expect(SetNetworkProfile.build).toHaveBeenCalledTimes(1);
      expect(SetNetworkProfile.build).toHaveBeenCalledWith(
        expect.objectContaining({
          ocppConnectionName: MOCK_STATION_ID_1,
          tenantId: MOCK_TENANT_ID,
          correlationId: MOCK_CORRELATION_ID,
          configurationSlot: 1,
          websocketServerConfigId: MOCK_WEBSOCKET_SERVER_CONFIG_ID,
        }),
      );
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should create one SetNetworkProfile record per station when multiple identifiers are provided', async () => {
      const extraQueries = { websocketServerConfigId: MOCK_WEBSOCKET_SERVER_CONFIG_ID };

      await ConfigurationOcpp2Api.prototype.setNetworkProfile.call(
        api,
        [MOCK_STATION_ID_1, MOCK_STATION_ID_2],
        mockRequest,
        undefined,
        MOCK_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
        extraQueries,
      );

      expect(SetNetworkProfile.build).toHaveBeenCalledTimes(2);
      expect(SetNetworkProfile.build).toHaveBeenCalledWith(
        expect.objectContaining({ ocppConnectionName: MOCK_STATION_ID_1 }),
      );
      expect(SetNetworkProfile.build).toHaveBeenCalledWith(
        expect.objectContaining({ ocppConnectionName: MOCK_STATION_ID_2 }),
      );
      expect(mockSave).toHaveBeenCalledTimes(2);
    });

    it('should not create SetNetworkProfile records when extraQueries is undefined', async () => {
      await ConfigurationOcpp2Api.prototype.setNetworkProfile.call(
        api,
        [MOCK_STATION_ID_1],
        mockRequest,
        undefined,
        MOCK_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
      );

      expect(SetNetworkProfile.build).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should send calls to all identifiers regardless of extraQueries', async () => {
      await ConfigurationOcpp2Api.prototype.setNetworkProfile.call(
        api,
        [MOCK_STATION_ID_1, MOCK_STATION_ID_2],
        mockRequest,
        undefined,
        MOCK_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
      );

      expect(mockSendCall).toHaveBeenCalledTimes(2);
      expect(mockSendCall).toHaveBeenCalledWith(
        MOCK_STATION_ID_1,
        MOCK_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.SetNetworkProfile,
        mockRequest,
        undefined,
        MOCK_CORRELATION_ID,
      );
      expect(mockSendCall).toHaveBeenCalledWith(
        MOCK_STATION_ID_2,
        MOCK_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.SetNetworkProfile,
        mockRequest,
        undefined,
        MOCK_CORRELATION_ID,
      );
    });
  });
});
