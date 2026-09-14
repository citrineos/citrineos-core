// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type IMessageContext } from '@citrineos/base';
import type {
  Authorization,
  IAuthorizationRepository,
  IChargingStationRepository,
} from '@citrineos/dal';
import {
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  type ConnectorDto,
  type EvseDto,
  type SystemConfig,
} from '@citrineos/types';
import { RealTimeAuthorizer } from '@services/authorizer/real-time-authorizer.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';

function buildMockLocationRepository(chargingStation: unknown): Mocked<IChargingStationRepository> {
  return {
    readChargingStationByOcppConnectionName: vi.fn().mockResolvedValue(chargingStation),
  } as unknown as Mocked<IChargingStationRepository>;
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

const REAL_TIME_AUTH_REQUEST_TIMEOUT_SECONDS = 5;
const testConfig = {
  timeouts: {
    realTimeAuthRequestTimeoutSeconds: REAL_TIME_AUTH_REQUEST_TIMEOUT_SECONDS,
  },
} as SystemConfig;

describe('RealTimeAuthorizer', () => {
  const { container, logger } = createTestContainer();
  let fetchMock: ReturnType<typeof vi.fn>;
  let chargingStationRepository: Mocked<IChargingStationRepository>;
  let authorizationRepository: Mocked<IAuthorizationRepository>;

  function buildAuthorizer(
    chargingStation: unknown = { locationId: null, evses: [] },
  ): RealTimeAuthorizer {
    chargingStationRepository = buildMockLocationRepository(chargingStation);
    authorizationRepository = buildMockAuthorizationRepository();
    return getTestInstance(container, RealTimeAuthorizer, {
      chargingStationRepository,
      authorizationRepository,
      config: testConfig,
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
    const chargingStation = { locationId: null, evses: [] };
    const repo = buildMockLocationRepository(chargingStation);
    const authorizer = getTestInstance(container, RealTimeAuthorizer, {
      chargingStationRepository: repo,
      authorizationRepository,
      config: testConfig,
    });

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
    expect(key).toBe(String(authorization.id));
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

  it('aborts the real-time auth request after the configured request timeout', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    const authorizer = buildAuthorizer();

    await authorizer.authorize(buildAuthorization(), buildContext(), evse, connector);

    expect(timeoutSpy).toHaveBeenCalledWith(REAL_TIME_AUTH_REQUEST_TIMEOUT_SECONDS * 1000);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
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
