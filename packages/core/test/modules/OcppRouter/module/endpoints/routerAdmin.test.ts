// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, type BootstrapConfig } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteWebsocketConnectionEndpoint } from '@modules/OcppRouter/src/module/endpoints/DeleteWebsocketConnectionEndpoint.js';
import { GetSystemConfigEndpoint } from '@modules/OcppRouter/src/module/endpoints/GetSystemConfigEndpoint.js';
import { PutSystemConfigEndpoint } from '@modules/OcppRouter/src/module/endpoints/PutSystemConfigEndpoint.js';
import { ReloadTlsCertificatesEndpoint } from '@modules/OcppRouter/src/module/endpoints/ReloadTlsCertificatesEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';
import { aSystemConfig } from '@test/providers/systemConfig.js';

const PREFIX = '/ocpprouter';

describe('router admin endpoints', () => {
  const { container } = createTestContainer();

  let config: BootstrapConfig & SystemConfig;
  let saveConfig: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  let reloadTlsCertificates: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    config = aSystemConfig();
    saveConfig = vi.fn().mockResolvedValue(undefined);
    disconnect = vi.fn().mockResolvedValue(undefined);
    reloadTlsCertificates = vi.fn().mockResolvedValue(undefined);
  });

  const mount = (
    endpointClass: Parameters<typeof getTestInstance>[1],
    deps: Record<string, unknown> = {},
  ): Promise<MountedEndpoint> => {
    const endpoint = getTestInstance(container, endpointClass, deps);
    return mountEndpoint(endpoint, endpointClass.route, PREFIX);
  };

  describe('GetSystemConfigEndpoint', () => {
    it('returns the live config', async () => {
      const mounted = await mount(GetSystemConfigEndpoint, { config });

      const response = await mounted.server.inject({
        method: 'GET',
        url: `${PREFIX}/systemConfig`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ env: 'development', logLevel: 2 });
    });
  });

  describe('PutSystemConfigEndpoint', () => {
    it('persists the submitted config', async () => {
      const mounted = await mount(PutSystemConfigEndpoint, { config, configStore: { saveConfig } });
      const submitted = aSystemConfig({ logLevel: 5 });

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${PREFIX}/systemConfig`,
        payload: submitted,
      });

      expect(response.statusCode).toBe(200);
      expect(saveConfig).toHaveBeenCalledTimes(1);
    });

    it('updates the shared config object in place so existing holders see the change', async () => {
      const mounted = await mount(PutSystemConfigEndpoint, { config, configStore: { saveConfig } });

      await mounted.server.inject({
        method: 'PUT',
        url: `${PREFIX}/systemConfig`,
        payload: aSystemConfig({ logLevel: 5 }),
      });

      expect(config.logLevel).toBe(5);
    });

    it('does not persist a body that fails the config schema', async () => {
      const mounted = await mount(PutSystemConfigEndpoint, { config, configStore: { saveConfig } });

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${PREFIX}/systemConfig`,
        payload: { env: 'not-a-valid-env' },
      });

      expect(response.statusCode).toBe(400);
      expect(saveConfig).not.toHaveBeenCalled();
    });
  });

  describe('DeleteWebsocketConnectionEndpoint', () => {
    it('disconnects the named station for the given tenant', async () => {
      const mounted = await mount(DeleteWebsocketConnectionEndpoint, {
        networkConnection: { disconnect },
      });

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${PREFIX}/connection?ocppConnectionName=cs001&tenantId=${DEFAULT_TENANT_ID}`,
      });

      expect(response.statusCode).toBe(200);
      expect(disconnect).toHaveBeenCalledWith(DEFAULT_TENANT_ID, 'cs001');
    });

    it('rejects a request without a station name', async () => {
      const mounted = await mount(DeleteWebsocketConnectionEndpoint, {
        networkConnection: { disconnect },
      });

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${PREFIX}/connection?tenantId=${DEFAULT_TENANT_ID}`,
      });

      expect(response.statusCode).toBe(400);
      expect(disconnect).not.toHaveBeenCalled();
    });
  });

  describe('ReloadTlsCertificatesEndpoint', () => {
    it('reloads certificates for the requested server', async () => {
      const mounted = await mount(ReloadTlsCertificatesEndpoint, {
        networkConnection: { reloadTlsCertificates },
      });

      const response = await mounted.server.inject({
        method: 'POST',
        url: `${PREFIX}/tlsReload?serverId=server-1`,
      });

      expect(response.statusCode).toBe(200);
      expect(reloadTlsCertificates).toHaveBeenCalledWith('server-1');
    });

    it('fails when the network connection cannot reload certificates', async () => {
      const mounted = await mount(ReloadTlsCertificatesEndpoint, { networkConnection: {} });

      const response = await mounted.server.inject({
        method: 'POST',
        url: `${PREFIX}/tlsReload?serverId=server-1`,
      });

      expect(response.statusCode).toBe(500);
      expect(mounted.loggedErrors).toHaveLength(1);
    });
  });
});
