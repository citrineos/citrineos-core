// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1, type SystemConfig } from '@citrineos/types';
import { SequelizeDeviceModelRepository } from '@dal/repositories/sequelize/device-model.js';
import { SequelizeRepository } from '@dal/repositories/sequelize/base.js';
import { stationIdFilter } from '@dal/repositories/sequelize/resolve-station-id.js';
import type { Sequelize } from 'sequelize-typescript';
import type { ILogObj, Logger } from 'tslog';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@dal/repositories/sequelize/resolve-station-id.js', () => ({
  resolveStationIdOrThrow: vi.fn(),
  stationIdFilter: vi.fn(),
}));

describe('SequelizeDeviceModelRepository EVSE scoping', () => {
  let repo: SequelizeDeviceModelRepository;

  beforeEach(() => {
    const mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      getSubLogger: vi.fn().mockReturnThis(),
    } as unknown as Logger<ILogObj>;

    repo = new SequelizeDeviceModelRepository({
      config: {} as SystemConfig,
      logger: mockLogger,
      sequelizeInstance: { models: {} } as unknown as Sequelize,
    });

    vi.mocked(stationIdFilter).mockResolvedValue(10);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('findVariableAttributeByComponentAndVariable filters by evseDatabaseId when evse is given and returns undefined if evse is missing', async () => {
    const evseReadSpy = vi
      .spyOn(repo.evse, 'readOnlyOneByQuery')
      .mockResolvedValueOnce({ databaseId: 55 } as never)
      .mockResolvedValueOnce(undefined);
    const readSpy = vi
      .spyOn(SequelizeRepository.prototype, 'readOnlyOneByQuery')
      .mockResolvedValue({ id: 1 } as never);

    await repo.findVariableAttributeByComponentAndVariable(
      1,
      'cs-1',
      OCPP2_0_1.AttributeEnumType.Actual,
      { name: 'Connector', evse: { id: 2, connectorId: 1 } },
      { name: 'AvailabilityState' },
    );

    expect(evseReadSpy).toHaveBeenCalledTimes(1);
    expect(readSpy).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            where: expect.objectContaining({ name: 'Connector', evseDatabaseId: 55 }),
          }),
        ]),
      }),
    );

    readSpy.mockClear();
    const missing = await repo.findVariableAttributeByComponentAndVariable(
      1,
      'cs-1',
      OCPP2_0_1.AttributeEnumType.Actual,
      { name: 'Connector', evse: { id: 99 } },
      { name: 'AvailabilityState' },
    );
    expect(missing).toBeUndefined();
    expect(readSpy).not.toHaveBeenCalled();

    readSpy.mockClear();
    await repo.findVariableAttributeByComponentAndVariable(
      1,
      'cs-1',
      OCPP2_0_1.AttributeEnumType.Actual,
      { name: 'ClockCtrlr' },
      { name: 'TimeOffset' },
    );
    expect(readSpy).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            where: expect.objectContaining({ name: 'ClockCtrlr', evseDatabaseId: null }),
          }),
        ]),
      }),
    );
  });

  it('findComponentAndVariable skips component query when requested evse does not exist and requires null evseDatabaseId when evse is omitted', async () => {
    vi.spyOn(repo.evse, 'readOnlyOneByQuery').mockResolvedValueOnce(undefined);
    const componentReadSpy = vi
      .spyOn(repo.component, 'readOnlyOneByQuery')
      .mockResolvedValueOnce({ id: 9 } as never);
    const mockVariable = { id: 12, get: vi.fn().mockReturnValue(12) };
    const variableReadSpy = vi
      .spyOn(repo.variable, 'readOnlyOneByQuery')
      .mockResolvedValue(mockVariable as never);
    vi.spyOn(repo.variableCharacteristics, 'readOnlyOneByQuery').mockResolvedValue(undefined);

    const [missingComponent, foundVar] = await repo.findComponentAndVariable(
      1,
      { name: 'EVSE', evse: { id: 404 } },
      { name: 'Power' },
    );

    expect(missingComponent).toBeUndefined();
    expect(foundVar).toBe(mockVariable);
    expect(componentReadSpy).not.toHaveBeenCalled();
    expect(variableReadSpy).toHaveBeenCalledOnce();

    await repo.findComponentAndVariable(1, { name: 'ClockCtrlr' }, { name: 'TimeOffset' });
    expect(componentReadSpy).toHaveBeenCalledWith(1, {
      where: { name: 'ClockCtrlr', instance: null, evseDatabaseId: null },
    });
  });

  it('updateResultByStationId returns undefined without matching wrong EVSE when component.evse does not exist', async () => {
    vi.spyOn(repo.evse, 'readOnlyOneByQuery').mockResolvedValueOnce(undefined);
    const readSpy = vi.spyOn(SequelizeRepository.prototype, 'readOnlyOneByQuery');

    const updated = await repo.updateResultByStationId(
      1,
      {
        attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
        component: { name: 'Connector', evse: { id: 99 } },
        variable: { name: 'Enabled' },
      },
      'cs-1',
      '2026-01-01T00:00:00.000Z',
    );

    expect(updated).toBeUndefined();
    expect(readSpy).not.toHaveBeenCalled();
  });
});
