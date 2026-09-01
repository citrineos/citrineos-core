// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSubscriptionEndpoint } from '@modules/OcppRouter/endpoints/CreateSubscriptionEndpoint.js';
import { DeleteSubscriptionEndpoint } from '@modules/OcppRouter/endpoints/DeleteSubscriptionEndpoint.js';
import { GetSubscriptionsEndpoint } from '@modules/OcppRouter/endpoints/GetSubscriptionsEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';

const PREFIX = '/ocpprouter';
const URL = `${PREFIX}/subscription`;

describe('subscription admin endpoints', () => {
  const { container } = createTestContainer();

  let create: ReturnType<typeof vi.fn>;
  let readAllByStationId: ReturnType<typeof vi.fn>;
  let deleteByKey: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    create = vi.fn().mockResolvedValue({ id: 42 });
    readAllByStationId = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    deleteByKey = vi.fn().mockResolvedValue(undefined);
  });

  const mount = (
    endpointClass: Parameters<typeof getTestInstance>[1],
  ): Promise<MountedEndpoint> => {
    const endpoint = getTestInstance(container, endpointClass, {
      subscriptionRepository: { create, readAllByStationId, deleteByKey },
    });
    return mountEndpoint(endpoint, endpointClass.route, PREFIX);
  };

  describe('CreateSubscriptionEndpoint', () => {
    const aBody = (override: Record<string, unknown> = {}) => ({
      url: 'http://webhook',
      ocppConnectionName: 'cs001',
      onMessage: true,
      ...override,
    });

    it('returns the id of the created subscription', async () => {
      const mounted = await mount(CreateSubscriptionEndpoint);

      const response = await mounted.server.inject({
        method: 'POST',
        url: `${URL}?tenantId=${DEFAULT_TENANT_ID}`,
        payload: aBody(),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toBe(42);
    });

    it('stamps the tenant from the querystring onto the subscription', async () => {
      const mounted = await mount(CreateSubscriptionEndpoint);

      await mounted.server.inject({
        method: 'POST',
        url: `${URL}?tenantId=7`,
        payload: aBody(),
      });

      expect(create).toHaveBeenCalledWith(7, expect.objectContaining({ tenantId: 7 }));
    });

    it.each(['onConnect', 'onClose', 'onMessage', 'sentMessage'])(
      'accepts a subscription that only sets %s',
      async (flag) => {
        const mounted = await mount(CreateSubscriptionEndpoint);

        const response = await mounted.server.inject({
          method: 'POST',
          url: `${URL}?tenantId=${DEFAULT_TENANT_ID}`,
          payload: { url: 'http://webhook', ocppConnectionName: 'cs001', [flag]: true },
        });

        expect(response.statusCode).toBe(200);
      },
    );

    it('rejects a subscription that requests no events at all', async () => {
      const mounted = await mount(CreateSubscriptionEndpoint);

      const response = await mounted.server.inject({
        method: 'POST',
        url: `${URL}?tenantId=${DEFAULT_TENANT_ID}`,
        payload: { url: 'http://webhook', ocppConnectionName: 'cs001' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('at least one of');
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('GetSubscriptionsEndpoint', () => {
    it('returns the subscriptions for the requested station', async () => {
      const mounted = await mount(GetSubscriptionsEndpoint);

      const response = await mounted.server.inject({
        method: 'GET',
        url: `${URL}?ocppConnectionName=cs001&tenantId=${DEFAULT_TENANT_ID}`,
      });

      expect(response.json()).toEqual([{ id: 1 }, { id: 2 }]);
      expect(readAllByStationId).toHaveBeenCalledWith(DEFAULT_TENANT_ID, 'cs001');
    });

    it('rejects a request without a station name', async () => {
      const mounted = await mount(GetSubscriptionsEndpoint);

      const response = await mounted.server.inject({
        method: 'GET',
        url: `${URL}?tenantId=${DEFAULT_TENANT_ID}`,
      });

      expect(response.statusCode).toBe(400);
      expect(readAllByStationId).not.toHaveBeenCalled();
    });
  });

  describe('DeleteSubscriptionEndpoint', () => {
    it('deletes by id, stringified for the repository', async () => {
      const mounted = await mount(DeleteSubscriptionEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?id=99&tenantId=${DEFAULT_TENANT_ID}`,
      });

      expect(response.json()).toBe(true);
      expect(deleteByKey).toHaveBeenCalledWith(DEFAULT_TENANT_ID, '99');
    });

    it('falls back to the default tenant when none was given', async () => {
      const mounted = await mount(DeleteSubscriptionEndpoint);

      await mounted.server.inject({ method: 'DELETE', url: `${URL}?id=99` });

      expect(deleteByKey).toHaveBeenCalledWith(DEFAULT_TENANT_ID, '99');
    });

    it('surfaces a repository failure as a 500 and logs it', async () => {
      deleteByKey.mockRejectedValue(new Error('db down'));
      const mounted = await mount(DeleteSubscriptionEndpoint);

      const response = await mounted.server.inject({
        method: 'DELETE',
        url: `${URL}?id=99&tenantId=${DEFAULT_TENANT_ID}`,
      });

      expect(response.statusCode).toBe(500);
      expect(mounted.loggedErrors).toHaveLength(1);
    });
  });
});
