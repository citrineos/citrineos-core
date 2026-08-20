// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { CacheNamespace } from '@citrineos/base';
import type { TenantDto } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteWebsocketMappingEndpoint } from '@modules/OcppRouter/src/module/endpoints/DeleteWebsocketMappingEndpoint.js';
import { PutWebsocketMappingEndpoint } from '@modules/OcppRouter/src/module/endpoints/PutWebsocketMappingEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';

const PREFIX = '/ocpprouter';
const URL = `${PREFIX}/websocketMapping`;
const TENANT_ID = 1;

function aTenant(overrides?: Partial<TenantDto>): TenantDto {
  return {
    id: TENANT_ID,
    name: 'tenant-1',
    isUserTenant: false,
    tenantWebsocketServerPath: null,
    ...overrides,
  } as TenantDto;
}

describe('websocket mapping admin endpoints', () => {
  const { container } = createTestContainer();

  let readByKey: ReturnType<typeof vi.fn>;
  let readByWebsocketServerPath: ReturnType<typeof vi.fn>;
  let updateWebsocketServerPath: ReturnType<typeof vi.fn>;
  let cacheSet: ReturnType<typeof vi.fn>;
  let cacheRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    readByKey = vi.fn().mockResolvedValue(aTenant());
    readByWebsocketServerPath = vi.fn().mockResolvedValue(undefined);
    updateWebsocketServerPath = vi
      .fn()
      .mockImplementation((tenantId: number, path: string | null) =>
        Promise.resolve(aTenant({ id: tenantId, tenantWebsocketServerPath: path })),
      );
    cacheSet = vi.fn().mockResolvedValue(undefined);
    cacheRemove = vi.fn().mockResolvedValue(true);
  });

  const mount = (
    endpointClass: Parameters<typeof getTestInstance>[1],
  ): Promise<MountedEndpoint> => {
    const endpoint = getTestInstance(container, endpointClass, {
      cache: { set: cacheSet, remove: cacheRemove },
      tenantRepository: {
        readByKey,
        readByWebsocketServerPath,
        updateWebsocketServerPath,
      },
    });
    return mountEndpoint(endpoint, endpointClass.route, PREFIX);
  };

  describe('PutWebsocketMappingEndpoint', () => {
    it('assigns the path to the tenant and caches it', async () => {
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?path=acme&tenantId=${TENANT_ID}`,
      });

      expect(response.statusCode).toBe(200);
      expect(updateWebsocketServerPath).toHaveBeenCalledWith(TENANT_ID, 'acme');
      expect(cacheSet).toHaveBeenCalledWith(
        'acme',
        String(TENANT_ID),
        CacheNamespace.TenantPathMapping,
      );
      expect(cacheRemove).not.toHaveBeenCalled();
      expect(response.json().tenantWebsocketServerPath).toBe('acme');
    });

    it('evicts the previous path from the cache when a tenant is re-mapped', async () => {
      readByKey.mockResolvedValue(aTenant({ tenantWebsocketServerPath: 'old-path' }));
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?path=new-path&tenantId=${TENANT_ID}`,
      });

      expect(response.statusCode).toBe(200);
      expect(cacheRemove).toHaveBeenCalledWith('old-path', CacheNamespace.TenantPathMapping);
      expect(cacheSet).toHaveBeenCalledWith(
        'new-path',
        String(TENANT_ID),
        CacheNamespace.TenantPathMapping,
      );
    });

    it('is idempotent when the path already belongs to the same tenant', async () => {
      readByKey.mockResolvedValue(aTenant({ tenantWebsocketServerPath: 'acme' }));
      readByWebsocketServerPath.mockResolvedValue(
        aTenant({ tenantWebsocketServerPath: 'acme' }),
      );
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?path=acme&tenantId=${TENANT_ID}`,
      });

      expect(response.statusCode).toBe(200);
      expect(updateWebsocketServerPath).toHaveBeenCalledWith(TENANT_ID, 'acme');
      // Same path, so there is no stale entry to evict.
      expect(cacheRemove).not.toHaveBeenCalled();
      expect(cacheSet).toHaveBeenCalledWith(
        'acme',
        String(TENANT_ID),
        CacheNamespace.TenantPathMapping,
      );
    });

    it('rejects a path already mapped to another tenant', async () => {
      readByWebsocketServerPath.mockResolvedValue(
        aTenant({ id: 9, tenantWebsocketServerPath: 'acme' }),
      );
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?path=acme&tenantId=${TENANT_ID}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('already mapped to tenant 9');
      expect(updateWebsocketServerPath).not.toHaveBeenCalled();
      expect(cacheSet).not.toHaveBeenCalled();
    });

    // A multi-segment path would resolve to whatever its last segment is, letting a tenant
    // register 'tenant2/tenant1' and have its connections land on tenant1.
    it.each(['tenant2%2Ftenant1', '%2Fleading', 'trailing%2F', 'has%20space'])(
      'rejects the path %j because it is not a single URL segment',
      async (encodedPath) => {
        const mounted = await mount(PutWebsocketMappingEndpoint);

        const response = await mounted.server.inject({
          method: 'PUT',
          url: `${URL}?path=${encodedPath}&tenantId=${TENANT_ID}`,
        });

        expect(response.statusCode).toBe(400);
        expect(updateWebsocketServerPath).not.toHaveBeenCalled();
        expect(cacheSet).not.toHaveBeenCalled();
      },
    );

    it('rejects an empty path', async () => {
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?path=&tenantId=${TENANT_ID}`,
      });

      expect(response.statusCode).toBe(400);
      expect(updateWebsocketServerPath).not.toHaveBeenCalled();
      expect(cacheSet).not.toHaveBeenCalled();
    });

    it('404s when the tenant does not exist', async () => {
      readByKey.mockResolvedValue(undefined);
      const mounted = await mount(PutWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'PUT',
        url: `${URL}?path=acme&tenantId=404`,
      });

      expect(response.statusCode).toBe(404);
      expect(updateWebsocketServerPath).not.toHaveBeenCalled();
      expect(cacheSet).not.toHaveBeenCalled();
    });
  });

  describe('DeleteWebsocketMappingEndpoint', () => {
    it('clears the mapping and removes the cached path', async () => {
      readByKey.mockResolvedValue(aTenant({ tenantWebsocketServerPath: 'acme' }));
      const mounted = await mount(DeleteWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?tenantId=${TENANT_ID}`,
      });

      expect(response.statusCode).toBe(200);
      expect(updateWebsocketServerPath).toHaveBeenCalledWith(TENANT_ID, null);
      expect(cacheRemove).toHaveBeenCalledWith('acme', CacheNamespace.TenantPathMapping);
      expect(response.json().tenantWebsocketServerPath).toBeNull();
    });

    it('404s when the tenant has no mapping to delete', async () => {
      const mounted = await mount(DeleteWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?tenantId=${TENANT_ID}`,
      });

      expect(response.statusCode).toBe(404);
      expect(updateWebsocketServerPath).not.toHaveBeenCalled();
      expect(cacheRemove).not.toHaveBeenCalled();
    });

    it('404s when the tenant does not exist', async () => {
      readByKey.mockResolvedValue(undefined);
      const mounted = await mount(DeleteWebsocketMappingEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?tenantId=404`,
      });

      expect(response.statusCode).toBe(404);
      expect(updateWebsocketServerPath).not.toHaveBeenCalled();
      expect(cacheRemove).not.toHaveBeenCalled();
    });
  });
});
