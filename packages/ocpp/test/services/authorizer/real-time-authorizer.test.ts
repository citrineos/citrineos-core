// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type IMessageContext } from '@citrineos/base';
import {
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  type ConnectorDto,
  type EvseDto,
  type SystemConfig,
} from '@citrineos/types';
import type { Authorization, IAuthorizationRepository, ILocationRepository } from '@citrineos/dal';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { RealTimeAuthorizer } from '@/services/authorizer/real-time-authorizer.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

function buildMockLocationRepository(chargingStation: unknown): Mocked<ILocationRepository> {
  return {
    readChargingStationByStationId: vi.fn().mockResolvedValue(chargingStation),
  } as unknown as Mocked<ILocationRepository>;
}

function buildMockAuthorizationRepository(): Mocked<IAuthorizationRepository> {
  return {
    updateByKey: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<IAuthorizationRepository>;
}

function buildAuthorization(overrides: Record<string, unknown> = {}): Authorization {
  return {
    id: 42,
    realTimeAuthUrl: 'http://realtime-auth.test/check',
    realTimeAuth: AuthorizationWhitelistEnum.Never,
    status: AuthorizationStatusEnum.Accepted,
    tenantPartnerId: 7,
    idToken: 'F00B4C',
    idTokenType: 'ISO14443',
    realTimeAuthLastAttempt: undefined,
    ...overrides,
  } as unknown as Authorization;
}

function buildContext(): IMessageContext {
  return {
    tenantId: 1,
    ocppConnectionName: 'CP-001',
    correlationId: 'cid',
    timestamp: new Date().toISOString(),
  } as IMessageContext;
}

const evse = { id: 10 } as EvseDto;
const connector = { id: 100 } as ConnectorDto;

describe('RealTimeAuthorizer', () => {
  const { container, logger } = createTestContainer();
  let fetchMock: ReturnType<typeof vi.fn>;
  let locationRepository: Mocked<ILocationRepository>;
  let authorizationRepository: Mocked<IAuthorizationRepository>;

  function buildAuthorizer(
    chargingStation: unknown = { locationId: null, evses: [] },
  ): RealTimeAuthorizer {
    locationRepository = buildMockLocationRepository(chargingStation);
    authorizationRepository = buildMockAuthorizationRepository();
    return getTestInstance(container, RealTimeAuthorizer, {
      locationRepository,
      authorizationRepository,
      config: {} as SystemConfig,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        timestamp: new Date().toISOString(),
        data: { allowed: 'ALLOWED' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('does not throw when ChargingStation has no Location (locationId is null)', async () => {
    const authorizer = buildAuthorizer({ locationId: null, evses: [] });

    const result = await authorizer.authorize(
      buildAuthorization(),
      buildContext(),
      evse,
      connector,
    );

    expect(result).toBe(AuthorizationStatusEnum.Accepted);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).not.toHaveProperty('locationId');
  });

  it('persists the last attempt through the authorization repository', async () => {
    const authorizer = buildAuthorizer();
    const authorization = buildAuthorization();
    const context = buildContext();

    const result = await authorizer.authorize(authorization, context, evse, connector);

    expect(result).toBe(AuthorizationStatusEnum.Accepted);
    expect(authorizationRepository.updateByKey).toHaveBeenCalledTimes(1);

    const [tenantId, value, key] = authorizationRepository.updateByKey.mock.calls[0];
    expect(tenantId).toBe(context.tenantId);
    expect(key).toBe(authorization.id);
    expect(value).toBe(authorization);
    expect((value as Authorization).realTimeAuthLastAttempt).toEqual({
      timestamp: expect.any(String),
      result: AuthorizationStatusEnum.Accepted,
      ocppConnectionName: context.ocppConnectionName,
      evseId: evse.id,
      connectorId: connector.id,
    });
  });

  it('persists a non-accepted result returned by the real-time auth endpoint', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        timestamp: new Date().toISOString(),
        data: { allowed: 'BLOCKED' },
      }),
    });
    const authorizer = buildAuthorizer();
    const authorization = buildAuthorization();

    const result = await authorizer.authorize(authorization, buildContext(), evse, connector);

    expect(result).toBe(AuthorizationStatusEnum.Blocked);
    expect(authorizationRepository.updateByKey).toHaveBeenCalledTimes(1);
    expect(authorization.realTimeAuthLastAttempt).toMatchObject({
      result: AuthorizationStatusEnum.Blocked,
    });
  });

  it('returns the result and logs when persisting the last attempt fails', async () => {
    const authorizer = buildAuthorizer();
    authorizationRepository.updateByKey.mockRejectedValue(new Error('db down'));
    const authorization = buildAuthorization();

    const result = await authorizer.authorize(authorization, buildContext(), evse, connector);

    expect(result).toBe(AuthorizationStatusEnum.Accepted);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        `Failed to save realTimeAuthLastAttempt for authorization ${authorization.id}`,
      ),
    );
  });

  it('does not persist anything when real-time auth is skipped', async () => {
    const authorizer = buildAuthorizer();

    const result = await authorizer.authorize(
      buildAuthorization({ realTimeAuthUrl: undefined }),
      buildContext(),
      evse,
      connector,
    );

    expect(result).toBe(AuthorizationStatusEnum.Accepted);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(authorizationRepository.updateByKey).not.toHaveBeenCalled();
  });
});
