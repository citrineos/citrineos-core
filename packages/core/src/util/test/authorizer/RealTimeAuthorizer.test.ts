// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  type ConnectorDto,
  type EvseDto,
  type IMessageContext,
  type SystemConfig,
} from '@citrineos/base';
import type { Authorization } from '@dal/layers/sequelize/index.js';
import type { ILocationRepository } from '@dal/interfaces/repositories.js';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { RealTimeAuthorizer } from '../../authorizer/RealTimeAuthorizer.js';
import { createTestContainer, getTestInstance } from '../../../test/testContainer.js';

function buildMockLocationRepository(chargingStation: unknown): Mocked<ILocationRepository> {
  return {
    readChargingStationByStationId: vi.fn().mockResolvedValue(chargingStation),
  } as unknown as Mocked<ILocationRepository>;
}

function buildAuthorization(): Authorization {
  return {
    id: 42,
    realTimeAuthUrl: 'http://realtime-auth.test/check',
    realTimeAuth: AuthorizationWhitelistEnum.Never,
    status: AuthorizationStatusEnum.Accepted,
    tenantPartnerId: 7,
    idToken: 'F00B4C',
    idTokenType: 'ISO14443',
    realTimeAuthLastAttempt: undefined,
    save: vi.fn().mockResolvedValue(undefined),
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
  const { container } = createTestContainer();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
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
      locationRepository: repo,
      config: {} as SystemConfig,
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
});
