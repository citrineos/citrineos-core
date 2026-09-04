// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkProfileService } from '@services/network-profile/network-profile-service.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

describe('NetworkProfileService', () => {
  const { container } = createTestContainer();
  const tenantId = DEFAULT_TENANT_ID;
  const stationA = 'Station01';
  const stationB = 'Station02';
  const websocketServerConfigId = 'ws-config-1';

  const apn: OCPP2_0_1.APNType = {
    apn: 'internet',
    apnAuthentication: OCPP2_0_1.APNAuthenticationEnumType.NONE,
  };
  const vpn: OCPP2_0_1.VPNType = {
    server: 'vpn.example.com',
    user: 'vpn-user',
    password: 'vpn-password',
    key: 'vpn-key',
    type: OCPP2_0_1.VPNEnumType.IPSec,
  };

  const request: OCPP2_0_1.SetNetworkProfileRequest = {
    configurationSlot: 1,
    connectionData: {
      ocppVersion: OCPP2_0_1.OCPPVersionEnumType.OCPP20,
      ocppTransport: OCPP2_0_1.OCPPTransportEnumType.JSON,
      ocppCsmsUrl: 'ws://example.com',
      messageTimeout: 30,
      securityProfile: 1,
      ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType.Wired0,
      apn,
      vpn,
    },
  };

  let mockCreatePending: ReturnType<typeof vi.fn>;
  let service: NetworkProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePending = vi.fn().mockResolvedValue(undefined);
    service = getTestInstance(container, NetworkProfileService, {
      setNetworkProfileRepository: { createPending: mockCreatePending },
    });
  });

  it('persists one pending record per station carrying the shared correlation id', async () => {
    const correlationId = await service.prepareSetNetworkProfile(
      tenantId,
      [stationA, stationB],
      request,
      { websocketServerConfigId },
    );

    expect(mockCreatePending).toHaveBeenCalledTimes(2);
    for (const ocppConnectionName of [stationA, stationB]) {
      expect(mockCreatePending).toHaveBeenCalledWith(
        expect.objectContaining({
          ocppConnectionName,
          tenantId,
          correlationId,
          configurationSlot: request.configurationSlot,
          websocketServerConfigId,
        }),
      );
    }
  });

  it('returns a correlation id and persists nothing when no persistence is requested', async () => {
    const correlationId = await service.prepareSetNetworkProfile(
      tenantId,
      [stationA],
      request,
      undefined,
    );

    expect(correlationId).toEqual(expect.any(String));
    expect(mockCreatePending).not.toHaveBeenCalled();
  });

  it('mints a distinct correlation id per call', async () => {
    const first = await service.prepareSetNetworkProfile(tenantId, [stationA], request);
    const second = await service.prepareSetNetworkProfile(tenantId, [stationA], request);

    expect(first).not.toEqual(second);
  });

  it('persists even when websocketServerConfigId is absent but persistence was requested', async () => {
    await service.prepareSetNetworkProfile(tenantId, [stationA], request, {});

    expect(mockCreatePending).toHaveBeenCalledTimes(1);
    expect(mockCreatePending).toHaveBeenCalledWith(
      expect.objectContaining({ websocketServerConfigId: undefined }),
    );
  });

  it('carries the connection data fields onto the persisted record', async () => {
    await service.prepareSetNetworkProfile(tenantId, [stationA], request, {});

    expect(mockCreatePending).toHaveBeenCalledWith(
      expect.objectContaining({
        ocppCsmsUrl: request.connectionData.ocppCsmsUrl,
        messageTimeout: request.connectionData.messageTimeout,
        securityProfile: request.connectionData.securityProfile,
      }),
    );
  });

  it('serializes apn and vpn, which are objects on the request but text columns on the row', async () => {
    await service.prepareSetNetworkProfile(tenantId, [stationA], request, {});

    expect(mockCreatePending).toHaveBeenCalledWith(
      expect.objectContaining({
        apn: JSON.stringify(apn),
        vpn: JSON.stringify(vpn),
      }),
    );
  });

  it('does not leak the raw apn and vpn objects onto the row', async () => {
    await service.prepareSetNetworkProfile(tenantId, [stationA], request, {});

    const persisted = mockCreatePending.mock.calls[0][0];
    expect(typeof persisted.apn).toBe('string');
    expect(typeof persisted.vpn).toBe('string');
  });

  it('serializes absent apn and vpn to undefined rather than a raw object', async () => {
    const withoutTunnels: OCPP2_0_1.SetNetworkProfileRequest = {
      configurationSlot: 1,
      connectionData: { ...request.connectionData, apn: undefined, vpn: undefined },
    };

    await service.prepareSetNetworkProfile(tenantId, [stationA], withoutTunnels, {});

    const persisted = mockCreatePending.mock.calls[0][0];
    expect(persisted.apn).toBeUndefined();
    expect(persisted.vpn).toBeUndefined();
  });
});
