// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { Authenticator, BasicAuthenticationFilter } from '@/transport/index.js';
import { UpgradeUnknownError } from '@/transport/network-connection/authenticator/errors/unknown-error.js';
import {
  aRequest,
  aRequestWithAuthorization,
  basicAuth,
} from '../../../providers/incoming-message-provider.js';
import { anAuthenticationOptions } from '../../../providers/authentication-options-provider.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

describe('Authenticator', () => {
  const { container } = createTestContainer();
  const password = 'SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3';

  const unknownStationFilter = { authenticate: vi.fn() };
  const connectedStationFilter = { authenticate: vi.fn() };
  const networkProfileFilter = { authenticate: vi.fn() };
  const variableAttributeRepository = { readAllByQuerystring: vi.fn() };
  const basicAuthenticationFilter = getTestInstance(container, BasicAuthenticationFilter, {
    variableAttributeRepository,
  });
  const authenticator = getTestInstance(container, Authenticator, {
    unknownStationFilter,
    connectedStationFilter,
    networkProfileFilter,
    basicAuthenticationFilter,
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['RDAM%7C123', 'RDAM|123'],
    ['RDAM%20123', 'RDAM 123'],
  ])(
    'authenticates the percent-encoded path segment %s as station %s',
    async (pathSegment, identity) => {
      variableAttributeRepository.readAllByQuerystring.mockResolvedValue([{ value: password }]);

      const result = await authenticator.authenticate(
        aRequestWithAuthorization(basicAuth(identity, password), {
          url: `/ocpp/${pathSegment}?foo=bar`,
        }),
        DEFAULT_TENANT_ID,
        anAuthenticationOptions({ securityProfile: 1 }),
      );

      expect(result).toEqual({ identifier: identity });
      expect(unknownStationFilter.authenticate).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        identity,
        expect.anything(),
        expect.anything(),
      );
    },
  );

  it('rejects a malformed percent escape as an unknown station', async () => {
    await expect(
      authenticator.authenticate(
        aRequest({ url: '/ocpp/RDAM%7' }),
        DEFAULT_TENANT_ID,
        anAuthenticationOptions({ securityProfile: 0 }),
      ),
    ).rejects.toBeInstanceOf(UpgradeUnknownError);
    expect(unknownStationFilter.authenticate).not.toHaveBeenCalled();
  });
});
