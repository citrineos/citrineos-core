// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { CacheNamespace, DEFAULT_TENANT_ID, type BootstrapConfig } from '@citrineos/base';
import type { SystemConfig, WebsocketServerConfig } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteWebsocketMappingEndpoint } from '@modules/OcppRouter/src/module/endpoints/DeleteWebsocketMappingEndpoint.js';
import { PutWebsocketMappingEndpoint } from '@modules/OcppRouter/src/module/endpoints/PutWebsocketMappingEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';
import { aSystemConfig } from '@test/providers/systemConfig.js';

const PREFIX = '/ocpprouter';
const URL = `${PREFIX}/websocketMapping`;

function aWebsocketServer(id: string): WebsocketServerConfig {
  return {
    id,
    host: '0.0.0.0',
    port: 8081,
    pingInterval: 60,
    protocols: ['ocpp2.0.1'],
    securityProfile: 0,
    allowUnknownChargingStations: true,
    dynamicTenantResolution: false,
    tenantId: DEFAULT_TENANT_ID,
  };
}

describe('websocket mapping admin endpoints', () => {
  const { container } = createTestContainer();

  let config: BootstrapConfig & SystemConfig;
  let saveConfig: ReturnType<typeof vi.fn>;
  let fetchConfig: ReturnType<typeof vi.fn>;
  let upsertServerNetworkProfile: ReturnType<typeof vi.fn>;
  let cacheSet: ReturnType<typeof vi.fn>;
  let cacheRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    config = aSystemConfig();
    config.util.networkConnection.websocketServers = [aWebsocketServer('server-1')];
    saveConfig = vi.fn().mockResolvedValue(undefined);
    fetchConfig = vi.fn().mockResolvedValue(undefined);
    upsertServerNetworkProfile = vi.fn().mockResolvedValue(undefined);
    cacheSet = vi.fn().mockResolvedValue(undefined);
    cacheRemove = vi.fn().mockResolvedValue(undefined);
  });

  const mount = (
    endpointClass: Parameters<typeof getTestInstance>[1],
  ): Promise<MountedEndpoint> => {
    const endpoint = getTestInstance(container, endpointClass, {
      config,
      configStore: { saveConfig, fetchConfig },
      cache: { set: cacheSet, remove: cacheRemove },
      serverNetworkProfileRepository: { upsertServerNetworkProfile },
    });
    return mountEndpoint(endpoint, endpointClass.route, PREFIX);
  };

  const server = () => config.util.networkConnection.websocketServers[0];

  describe('PutWebsocketMappingEndpoint', () => {
    it('adds the mapping, enables dynamic resolution and persists everything', async () => {
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?id=server-1&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(200);
      expect(server().tenantPathMapping).toEqual({ '/cs': 5 });
      expect(server().dynamicTenantResolution).toBe(true);
      expect(saveConfig).toHaveBeenCalledWith(config);
      expect(upsertServerNetworkProfile).toHaveBeenCalledWith(
        server(),
        config.maxCallLengthSeconds,
      );
    });

    it('caches the mapping under the tenant path mapping namespace', async () => {
      const mounted = await mount(PutWebsocketMappingEndpoint);

      await mounted.server.inject({ method: 'PUT', url: `${URL}?id=server-1&path=/cs&tenantId=5` });

      expect(cacheSet).toHaveBeenCalledWith(
        expect.stringContaining('server-1'),
        '5',
        CacheNamespace.TenantPathMapping,
      );
    });

    it('refreshes from the config store before mutating', async () => {
      const mounted = await mount(PutWebsocketMappingEndpoint);

      await mounted.server.inject({ method: 'PUT', url: `${URL}?id=server-1&path=/cs&tenantId=5` });

      expect(fetchConfig).toHaveBeenCalled();
    });

    it('is idempotent when the path already maps to the same tenant', async () => {
      server().tenantPathMapping = { '/cs': 5 };
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?id=server-1&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(200);
      expect(server().tenantPathMapping).toEqual({ '/cs': 5 });
    });

    it('rejects remapping a path that belongs to another tenant', async () => {
      server().tenantPathMapping = { '/cs': 9 };
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?id=server-1&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('already mapped to tenant 9');
      expect(saveConfig).not.toHaveBeenCalled();
    });

    it('404s for an unknown server id', async () => {
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?id=nope&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(404);
      expect(saveConfig).not.toHaveBeenCalled();
    });
  });

  describe('DeleteWebsocketMappingEndpoint', () => {
    it('removes the mapping and evicts it from the cache', async () => {
      server().tenantPathMapping = { '/cs': 5, '/other': 6 };
      const mounted = await mount(DeleteWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?id=server-1&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(200);
      expect(server().tenantPathMapping).toEqual({ '/other': 6 });
      expect(cacheRemove).toHaveBeenCalledWith(
        expect.stringContaining('server-1'),
        CacheNamespace.TenantPathMapping,
      );
      expect(saveConfig).toHaveBeenCalledWith(config);
    });

    it('404s when the path is not mapped', async () => {
      server().tenantPathMapping = { '/other': 6 };
      const mounted = await mount(DeleteWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?id=server-1&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(404);
      expect(saveConfig).not.toHaveBeenCalled();
    });

    it('rejects deleting a mapping that belongs to another tenant', async () => {
      server().tenantPathMapping = { '/cs': 9 };
      const mounted = await mount(DeleteWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?id=server-1&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(400);
      expect(server().tenantPathMapping).toEqual({ '/cs': 9 });
      expect(saveConfig).not.toHaveBeenCalled();
    });

    it('404s for an unknown server id', async () => {
      const mounted = await mount(DeleteWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?id=nope&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('leaves an unmapped server untouched when it has no mapping table at all', async () => {
      const mounted = await mount(DeleteWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?id=server-1&path=/cs&tenantId=5`,
      });

      expect(response.statusCode).toBe(200);
      expect(saveConfig).not.toHaveBeenCalled();
      expect(cacheRemove).not.toHaveBeenCalled();
    });
  });
});
