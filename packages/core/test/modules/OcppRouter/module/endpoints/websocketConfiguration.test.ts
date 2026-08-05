// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, type BootstrapConfig } from '@citrineos/base';
import {
  type SystemConfig,
  type WebsocketServerConfig,
  systemConfigSchema,
} from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateWebsocketConfigurationEndpoint } from '@modules/OcppRouter/src/module/endpoints/CreateWebsocketConfigurationEndpoint.js';
import { DeleteWebsocketConfigurationEndpoint } from '@modules/OcppRouter/src/module/endpoints/DeleteWebsocketConfigurationEndpoint.js';
import { GetWebsocketConfigurationsEndpoint } from '@modules/OcppRouter/src/module/endpoints/GetWebsocketConfigurationsEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';
import { aSystemConfig } from '@test/providers/systemConfig.js';

const PREFIX = '/ocpprouter';
const URL = `${PREFIX}/websocket`;

function aWebsocketServer(id: string, port: number): WebsocketServerConfig {
  return {
    id,
    host: '0.0.0.0',
    port,
    pingInterval: 60,
    protocols: ['ocpp2.0.1'],
    securityProfile: 0,
    allowUnknownChargingStations: true,
    dynamicTenantResolution: false,
    tenantId: DEFAULT_TENANT_ID,
  };
}

describe('websocket configuration admin endpoints', () => {
  const { container } = createTestContainer();

  let config: BootstrapConfig & SystemConfig;
  let saveConfig: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    saveConfig = vi.fn().mockResolvedValue(undefined);
    config = aSystemConfig();
    config.util.networkConnection.websocketServers = [
      aWebsocketServer('first', 8081),
      aWebsocketServer('second', 8082),
      aWebsocketServer('third', 8083),
    ];
  });

  const mount = (
    endpointClass: Parameters<typeof getTestInstance>[1],
  ): Promise<MountedEndpoint> => {
    const endpoint = getTestInstance(container, endpointClass, {
      config,
      configStore: { saveConfig },
    });
    return mountEndpoint(endpoint, endpointClass.route, PREFIX);
  };

  const serverIds = () => config.util.networkConnection.websocketServers.map((ws) => ws.id);

  describe('GetWebsocketConfigurationsEndpoint', () => {
    it('returns every configured server when no id is given', async () => {
      const mounted = await mount(GetWebsocketConfigurationsEndpoint);

      const response = await mounted.server.inject({ method: 'GET', url: URL });

      expect(response.json().map((ws: WebsocketServerConfig) => ws.id)).toEqual([
        'first',
        'second',
        'third',
      ]);
    });

    it('returns a single server when an id is given', async () => {
      const mounted = await mount(GetWebsocketConfigurationsEndpoint);

      const response = await mounted.server.inject({ method: 'GET', url: `${URL}?id=second` });

      expect(response.json().id).toBe('second');
    });

    it('404s for an unknown id', async () => {
      const mounted = await mount(GetWebsocketConfigurationsEndpoint);

      const response = await mounted.server.inject({ method: 'GET', url: `${URL}?id=nope` });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toContain('nope');
    });
  });

  describe('CreateWebsocketConfigurationEndpoint', () => {
    it('appends the new server and persists the config', async () => {
      const mounted = await mount(CreateWebsocketConfigurationEndpoint);

      const response = await mounted.server.inject({
        method: 'POST',
        url: URL,
        payload: aWebsocketServer('fourth', 8084),
      });

      expect(response.statusCode).toBe(200);
      expect(serverIds()).toEqual(['first', 'second', 'third', 'fourth']);
      expect(saveConfig).toHaveBeenCalledWith(config);
    });

    it('accepts a body shaped like the persisted config type and leaves the config valid', async () => {
      const mounted = await mount(CreateWebsocketConfigurationEndpoint);

      const response = await mounted.server.inject({
        method: 'POST',
        url: URL,
        payload: aWebsocketServer('fourth', 8084),
      });

      expect(response.statusCode).toBe(200);
      expect(systemConfigSchema.safeParse(config).success).toBe(true);
    });

    it('rejects a body whose protocols are not valid OCPP versions', async () => {
      const mounted = await mount(CreateWebsocketConfigurationEndpoint);

      const response = await mounted.server.inject({
        method: 'POST',
        url: URL,
        payload: { ...aWebsocketServer('fourth', 8084), protocols: ['ocpp9.9'] },
      });

      expect(response.statusCode).toBe(400);
      expect(saveConfig).not.toHaveBeenCalled();
    });

    it('rejects a duplicate id without touching the stored config', async () => {
      const mounted = await mount(CreateWebsocketConfigurationEndpoint);

      const response = await mounted.server.inject({
        method: 'POST',
        url: URL,
        payload: aWebsocketServer('second', 9999),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('already exists');
      expect(serverIds()).toEqual(['first', 'second', 'third']);
      expect(saveConfig).not.toHaveBeenCalled();
    });
  });

  describe('DeleteWebsocketConfigurationEndpoint', () => {
    it('removes the matching server and persists the config', async () => {
      const mounted = await mount(DeleteWebsocketConfigurationEndpoint);

      const response = await mounted.server.inject({ method: 'DELETE', url: `${URL}?id=second` });

      expect(response.statusCode).toBe(200);
      expect(serverIds()).toEqual(['first', 'third']);
      expect(saveConfig).toHaveBeenCalledTimes(1);
    });
  });
});
