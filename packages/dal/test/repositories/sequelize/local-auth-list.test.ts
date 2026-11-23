// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP1_6, OCPP2_0_1, type SystemConfig } from '@citrineos/types';
import { Authorization } from '@dal/models/authorization/authorization.js';
import { LocalListAuthorization } from '@dal/models/authorization/local-list-authorization.js';
import { SendLocalList } from '@dal/models/authorization/send-local-list.js';
import { SendLocalListAuthorization } from '@dal/models/authorization/send-local-list-authorization.js';
import { SequelizeLocalAuthListRepository } from '@dal/repositories/sequelize/local-auth-list.js';
import type { Sequelize } from 'sequelize-typescript';
import type { ILogObj, Logger } from 'tslog';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('SequelizeLocalAuthListRepository', () => {
  let repository: SequelizeLocalAuthListRepository;

  beforeEach(() => {
    const mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      getSubLogger: vi.fn().mockReturnThis(),
    } as unknown as Logger<ILogObj>;

    repository = new SequelizeLocalAuthListRepository({
      config: {} as SystemConfig,
      logger: mockLogger,
      sequelizeInstance: { models: {} } as unknown as Sequelize,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes tenantId when building a Differential tombstone in OCPP 2.0.1 createSendLocalListFromRequestData', async () => {
    vi.spyOn(SendLocalList, 'build').mockReturnValue({ id: 1 } as unknown as SendLocalList);
    vi.spyOn(repository.sendLocalList, 'create').mockResolvedValue({
      id: 1,
      reload: vi.fn().mockResolvedValue(undefined),
    } as unknown as SendLocalList);
    const buildAuth = vi
      .spyOn(LocalListAuthorization, 'build')
      .mockReturnValue({ id: 2 } as unknown as LocalListAuthorization);
    vi.spyOn(repository.localListAuthorization, 'create').mockResolvedValue({
      id: 2,
    } as unknown as LocalListAuthorization);
    vi.spyOn(SendLocalListAuthorization, 'create').mockResolvedValue(
      {} as unknown as SendLocalListAuthorization,
    );

    await repository.createSendLocalListFromRequestData(
      42,
      'cs-01',
      'corr-1',
      OCPP2_0_1.UpdateEnumType.Differential,
      5,
      [{ idToken: { idToken: 'TAG-1', type: OCPP2_0_1.IdTokenEnumType.Central } }],
    );

    expect(buildAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 42,
        idToken: 'TAG-1',
        status: 'Invalid',
      }),
    );
  });

  it('copies plain attributes via auth.get({ plain: true }) in OCPP 1.6 createSendLocalListFromRequestData16', async () => {
    vi.spyOn(SendLocalList, 'build').mockReturnValue({ id: 1 } as unknown as SendLocalList);
    vi.spyOn(repository.sendLocalList, 'create').mockResolvedValue({
      id: 1,
      reload: vi.fn().mockResolvedValue(undefined),
    } as unknown as SendLocalList);
    const buildAuth = vi
      .spyOn(LocalListAuthorization, 'build')
      .mockReturnValue({ id: 3 } as unknown as LocalListAuthorization);
    vi.spyOn(repository.localListAuthorization, 'create').mockResolvedValue({
      id: 3,
    } as unknown as LocalListAuthorization);
    vi.spyOn(SendLocalListAuthorization, 'create').mockResolvedValue(
      {} as unknown as SendLocalListAuthorization,
    );

    const plainValues = {
      id: 10,
      tenantId: 42,
      idToken: 'TAG-16',
      concurrentTransaction: false,
      allowedConnectorTypes: ['cCCS2'],
      language1: 'en',
    };
    // Simulate a Sequelize model instance whose own enumerable properties are internal state,
    // while column fields live behind .get({ plain: true }).
    const sequelizeInstanceModel = {
      id: 10,
      dataValues: plainValues,
      isNewRecord: false,
      get: vi.fn().mockReturnValue(plainValues),
    } as unknown as Authorization;
    vi.spyOn(Authorization, 'findOne').mockResolvedValue(sequelizeInstanceModel);

    await repository.createSendLocalListFromRequestData16(
      42,
      'cs-01',
      'corr-2',
      OCPP1_6.SendLocalListRequestUpdateType.Full,
      7,
      [
        {
          idTag: 'TAG-16',
          idTagInfo: { status: OCPP1_6.SendLocalListRequestStatus.Accepted },
        },
      ],
    );

    expect(buildAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 42,
        idToken: 'TAG-16',
        idTokenType: null,
        concurrentTransaction: false,
        allowedConnectorTypes: ['cCCS2'],
        language1: 'en',
        authorizationId: 10,
      }),
    );
    const passedFields = buildAuth.mock.calls[0][0] as Record<string, unknown>;
    expect(passedFields).not.toHaveProperty('id');
    expect(passedFields).not.toHaveProperty('dataValues');
    expect(passedFields).not.toHaveProperty('isNewRecord');
  });
});
