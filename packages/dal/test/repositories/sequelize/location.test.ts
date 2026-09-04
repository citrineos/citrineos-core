// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ConnectorDto, SystemConfig } from '@citrineos/types';
import { ChargingStation } from '@dal/models/location/charging-station.js';
import { Connector } from '@dal/models/location/connector.js';
import { Evse } from '@dal/models/location/evse.js';
import { Tariff } from '@dal/models/tariff/tariffs.js';
import { SequelizeLocationRepository } from '@dal/repositories/sequelize/location.js';
import { createTestContainer, getTestInstance } from '../../test-container.js';
import { Op } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';
import type { ILogObj, Logger } from 'tslog';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';

// Mock the util module to avoid circular dependency issues during test loading
vi.mock('@dal/db/sequelize/util', () => ({
  DefaultSequelizeInstance: {
    getInstance: vi.fn(),
  },
}));

const TENANT_ID = 1;
const OCPP_CONNECTION_NAME = 'CP_TEST_001';

describe('SequelizeLocationRepository', () => {
  const { container } = createTestContainer();
  let repository: SequelizeLocationRepository;
  let mockTransaction: unknown;

  beforeEach(() => {
    mockTransaction = Symbol('transaction');
    const mockSequelize = {
      transaction: vi.fn((callback: (transaction: unknown) => Promise<unknown>) =>
        callback(mockTransaction),
      ),
    } as unknown as Mocked<Sequelize>;

    const mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      getSubLogger: vi.fn().mockReturnThis(),
    } as unknown as Mocked<Logger<ILogObj>>;

    repository = getTestInstance(container, SequelizeLocationRepository, {
      config: {} as SystemConfig,
      logger: mockLogger,
      sequelizeInstance: mockSequelize,
    });
  });

  describe('readConnectorsWithTariffsByStationId', () => {
    const aConnectorRow = () => ({ id: 1, tariffId: 7 }) as unknown as Connector;

    it('should read only the station connectors that carry a tariff', async () => {
      const readAllByQuery = vi
        .spyOn(repository.connector, 'readAllByQuery')
        .mockResolvedValue([aConnectorRow()]);

      const result = await repository.readConnectorsWithTariffsByStationId(
        TENANT_ID,
        OCPP_CONNECTION_NAME,
      );

      expect(result).toHaveLength(1);
      expect(readAllByQuery).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({
          where: {
            tenantId: TENANT_ID,
            ocppConnectionName: OCPP_CONNECTION_NAME,
            tariffId: { [Op.ne]: null },
          },
        }),
      );
    });

    it('should require both the evse and the tariff so untariffed connectors cannot leak through', async () => {
      const readAllByQuery = vi
        .spyOn(repository.connector, 'readAllByQuery')
        .mockResolvedValue([aConnectorRow()]);

      await repository.readConnectorsWithTariffsByStationId(TENANT_ID, OCPP_CONNECTION_NAME);

      const [, query] = readAllByQuery.mock.calls[0] as [number, { include: any[] }];
      expect(query.include).toEqual([
        { model: Evse, as: 'evse', required: true },
        { model: Tariff, as: 'tariff', required: true },
      ]);
    });

    it('should not constrain the evse when no evseTypeId is requested (I09.FR.01)', async () => {
      const readAllByQuery = vi
        .spyOn(repository.connector, 'readAllByQuery')
        .mockResolvedValue([aConnectorRow()]);

      await repository.readConnectorsWithTariffsByStationId(TENANT_ID, OCPP_CONNECTION_NAME);

      const [, query] = readAllByQuery.mock.calls[0] as [number, { include: any[] }];
      expect(query.include[0]).not.toHaveProperty('where');
    });

    it('should constrain the evse to the requested evseTypeId (I09.FR.02)', async () => {
      const readAllByQuery = vi
        .spyOn(repository.connector, 'readAllByQuery')
        .mockResolvedValue([aConnectorRow()]);

      await repository.readConnectorsWithTariffsByStationId(TENANT_ID, OCPP_CONNECTION_NAME, 2);

      const [, query] = readAllByQuery.mock.calls[0] as [number, { include: any[] }];
      expect(query.include[0]).toMatchObject({ where: { evseTypeId: 2 } });
    });

    it('should treat evseTypeId 0 as a filter rather than as absent', async () => {
      // evseId 0 addresses the station in OCPP 2.1, so the handler maps it to undefined
      // before calling in. A repository given an explicit 0 must still filter on it.
      const readAllByQuery = vi
        .spyOn(repository.connector, 'readAllByQuery')
        .mockResolvedValue([aConnectorRow()]);

      await repository.readConnectorsWithTariffsByStationId(TENANT_ID, OCPP_CONNECTION_NAME, 0);

      const [, query] = readAllByQuery.mock.calls[0] as [number, { include: any[] }];
      expect(query.include[0]).toMatchObject({ where: { evseTypeId: 0 } });
    });
  });

  describe('connector upserts', () => {
    const anOcpp16Connector = (): ConnectorDto & { connectorId: number } =>
      ({
        tenantId: TENANT_ID,
        ocppConnectionName: OCPP_CONNECTION_NAME,
        evseId: 4,
        connectorId: 3,
        status: 'Available',
      }) as ConnectorDto & { connectorId: number };

    const anOcpp2Connector = (): ConnectorDto & { evseTypeConnectorId: number } =>
      ({
        tenantId: TENANT_ID,
        ocppConnectionName: OCPP_CONNECTION_NAME,
        evseId: 4,
        evseTypeConnectorId: 1,
        status: 'Available',
      }) as ConnectorDto & { evseTypeConnectorId: number };

    const stubUpsert = (created: boolean) => {
      vi.spyOn(ChargingStation, 'findOne').mockResolvedValue({ id: 7 } as never);
      const saved = { id: 42 } as unknown as Connector;
      const readOrCreateByQuery = vi
        .spyOn(repository.connector, 'readOrCreateByQuery')
        .mockResolvedValue([saved, created]);
      const updateAllByQuery = vi
        .spyOn(repository.connector, 'updateAllByQuery')
        .mockResolvedValue([saved]);
      return { saved, readOrCreateByQuery, updateAllByQuery };
    };

    describe('createOrUpdateOcpp16Connector', () => {
      it('should key the connector on its station-wide connectorId', async () => {
        const { readOrCreateByQuery } = stubUpsert(true);

        await repository.createOrUpdateOcpp16Connector(TENANT_ID, anOcpp16Connector());

        expect(readOrCreateByQuery).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({
            where: {
              tenantId: TENANT_ID,
              ocppConnectionName: OCPP_CONNECTION_NAME,
              connectorId: 3,
            },
          }),
        );
      });
    });

    describe('createOrUpdateOcpp2Connector', () => {
      it('should key the connector on its evse and per-evse connector number', async () => {
        // A 2.x connector has no station-wide connectorId, and keying on a null one would
        // match nothing under Postgres NULL semantics — a duplicate row on every report.
        const { readOrCreateByQuery } = stubUpsert(true);

        await repository.createOrUpdateOcpp2Connector(TENANT_ID, anOcpp2Connector());

        expect(readOrCreateByQuery).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({
            where: {
              tenantId: TENANT_ID,
              evseId: 4,
              evseTypeConnectorId: 1,
            },
          }),
        );
      });
    });

    it('should never put an undefined value in the lookup key', async () => {
      const { readOrCreateByQuery } = stubUpsert(true);

      await repository.createOrUpdateOcpp16Connector(TENANT_ID, anOcpp16Connector());
      await repository.createOrUpdateOcpp2Connector(TENANT_ID, anOcpp2Connector());

      for (const [, query] of readOrCreateByQuery.mock.calls as [number, { where: object }][]) {
        expect(Object.values(query.where)).not.toContain(undefined);
      }
    });

    it('should update the existing row instead of creating when the connector is already known', async () => {
      const { saved, updateAllByQuery } = stubUpsert(false);
      const connector = anOcpp2Connector();

      const result = await repository.createOrUpdateOcpp2Connector(TENANT_ID, connector);

      expect(updateAllByQuery).toHaveBeenCalledWith(
        TENANT_ID,
        connector,
        expect.objectContaining({ where: { id: saved.id } }),
      );
      expect(result).toBe(saved);
    });
  });
});
