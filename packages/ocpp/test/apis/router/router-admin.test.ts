// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteWebsocketConnectionEndpoint } from '@/apis/router/delete-websocket-connection-endpoint.js';
import { ReloadTlsCertificatesEndpoint } from '@/apis/router/reload-tls-certificates-endpoint.js';
import { createTestContainer, getTestInstance, type Deps } from '@test/test-container.js';
import {
  mountEndpoint,
  type MountedEndpoint,
  type EndpointClass,
} from '@test/providers/endpoint-harness.js';

const PREFIX = '/ocpprouter';

describe('router admin endpoints', () => {
  const { container } = createTestContainer();

  let disconnect: ReturnType<typeof vi.fn>;
  let reloadTlsCertificates: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    disconnect = vi.fn().mockResolvedValue(undefined);
    reloadTlsCertificates = vi.fn().mockResolvedValue(undefined);
  });

  const mount = (
    endpointClass: EndpointClass,
    deps: Deps<EndpointClass> = {},
  ): Promise<MountedEndpoint> => {
    const endpoint = getTestInstance(container, endpointClass, deps);
    return mountEndpoint(endpoint, endpointClass.route, PREFIX);
  };

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
