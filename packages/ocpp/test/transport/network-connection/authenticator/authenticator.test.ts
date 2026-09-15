// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { describe, expect, it, vi } from 'vitest';
import { Authenticator, ClientCertificateFilter } from '@/transport/index.js';
import { UpgradeAuthenticationError } from '@/transport/network-connection/authenticator/errors/authentication-error.js';
import { aRequest, aTlsSocket } from '../../../providers/incoming-message-provider.js';
import { anAuthenticationOptions } from '../../../providers/authentication-options-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

describe('Authenticator', () => {
  const { container } = createTestContainer();
  const unknownStationFilter = { authenticate: vi.fn().mockResolvedValue(undefined) };
  const connectedStationFilter = { authenticate: vi.fn().mockResolvedValue(undefined) };
  const networkProfileFilter = { authenticate: vi.fn().mockResolvedValue(undefined) };
  const basicAuthenticationFilter = { authenticate: vi.fn().mockResolvedValue(undefined) };
  const chargingStationRepository = {
    readChargingStationByOcppConnectionName: vi.fn().mockResolvedValue(undefined),
  };
  const clientCertificateFilter = getTestInstance(container, ClientCertificateFilter, {
    chargingStationRepository,
  });
  const authenticator = getTestInstance(container, Authenticator, {
    unknownStationFilter,
    connectedStationFilter,
    networkProfileFilter,
    basicAuthenticationFilter,
    clientCertificateFilter,
  });
  const securityProfile3 = anAuthenticationOptions({ securityProfile: 3 });

  it('rejects a security profile 3 upgrade whose client certificate CN is not the station identity', async () => {
    const request = aRequest({ url: '/ocpp/CS-B', socket: aTlsSocket('CS-A') });

    await expect(
      authenticator.authenticate(request, DEFAULT_TENANT_ID, securityProfile3),
    ).rejects.toThrow(UpgradeAuthenticationError);
  });

  it('accepts a security profile 3 upgrade whose client certificate CN is the station identity', async () => {
    const request = aRequest({ url: '/ocpp/CS-A', socket: aTlsSocket('CS-A') });

    await expect(
      authenticator.authenticate(request, DEFAULT_TENANT_ID, securityProfile3),
    ).resolves.toEqual({ identifier: 'CS-A' });
  });
});
