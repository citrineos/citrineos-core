// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, Mock, Mocked, vi } from 'vitest';

// Mock the util module to avoid circular dependency issues during test loading
vi.mock('../../../../src/layers/sequelize/util', () => ({
  DefaultSequelizeInstance: {
    getInstance: vi.fn(),
  },
}));

import { BootstrapConfig, ChargingStationSequenceTypeEnum } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { ChargingStationSequence } from '../../../../src/layers/sequelize/model/ChargingStationSequence/ChargingStationSequence';
import { SequelizeChargingStationSequenceRepository } from '../../../../src/layers/sequelize/repository/ChargingStationSequence';

describe('SequelizeChargingStationSequenceRepository', () => {
  let repository: SequelizeChargingStationSequenceRepository;
  let mockSequelize: Mocked<Sequelize>;
  let mockTransaction: Mock;
  let mockLogger: Mocked<Logger<ILogObj>>;
  let mockConfig: BootstrapConfig;

  const tenantId = 1;
  const stationId = 'CP_TEST_001';
  const sequenceType = ChargingStationSequenceTypeEnum.getChargingProfiles;

  beforeEach(() => {
    mockTransaction = vi.fn();
    mockSequelize = {
      transaction: vi.fn((callback: (transaction: any) => Promise<any>) =>
        callback(mockTransaction),
      ),
    } as unknown as Mocked<Sequelize>;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      getSubLogger: vi.fn().mockReturnThis(),
    } as unknown as Mocked<Logger<ILogObj>>;

    mockConfig = {} as BootstrapConfig;

    repository = new SequelizeChargingStationSequenceRepository(
      mockConfig,
      mockLogger,
      mockSequelize,
    );
  });

  describe('getNextSequenceValue', () => {
    it('should return SEQUENCE_START when sequence is created (new sequence)', async () => {
      const mockSequence = {
        value: '1' as string | number,
      } as ChargingStationSequence;

      // Mock readOrCreateByQuery to return new sequence
      vi.spyOn(repository as any, 'readOrCreateByQuery').mockResolvedValue([mockSequence, true]);

      const result = await repository.getNextSequenceValue(tenantId, stationId, sequenceType);

      expect(result).toBe(1);
      expect(mockSequelize.transaction).toHaveBeenCalled();
    });

    it('should increment and return number when sequence exists (string bigint)', async () => {
      const mockIncrement = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const mockReload = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const mockSequence = {
        value: '5' as string | number,
        increment: mockIncrement,
        reload: mockReload,
      } as unknown as ChargingStationSequence;

      // Mock readOrCreateByQuery to return existing sequence
      vi.spyOn(repository as any, 'readOrCreateByQuery').mockResolvedValue([mockSequence, false]);

      const result = await repository.getNextSequenceValue(tenantId, stationId, sequenceType);

      expect(mockIncrement).toHaveBeenCalledWith('value', { transaction: mockTransaction });
      expect(mockReload).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(result).toBe(5);
      expect(typeof result).toBe('number');
    });

    it('should convert string bigint to number correctly', async () => {
      const mockSequence = {
        value: '42' as string | number,
        increment: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        reload: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      } as any as ChargingStationSequence;

      vi.spyOn(repository as any, 'readOrCreateByQuery').mockResolvedValue([mockSequence, false]);

      const result = await repository.getNextSequenceValue(tenantId, stationId, sequenceType);

      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    it('should handle number value correctly (already a number)', async () => {
      const mockSequence = {
        value: 100 as string | number,
        increment: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        reload: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      } as any as ChargingStationSequence;

      vi.spyOn(repository as any, 'readOrCreateByQuery').mockResolvedValue([mockSequence, false]);

      const result = await repository.getNextSequenceValue(tenantId, stationId, sequenceType);

      expect(result).toBe(100);
      expect(typeof result).toBe('number');
    });

    it('should handle null value and return SEQUENCE_START', async () => {
      const mockSequence = {
        value: null,
        increment: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        reload: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      } as any as ChargingStationSequence;

      vi.spyOn(repository as any, 'readOrCreateByQuery').mockResolvedValue([mockSequence, false]);

      const result = await repository.getNextSequenceValue(tenantId, stationId, sequenceType);

      expect(result).toBe(1); // SEQUENCE_START
    });

    it('should handle undefined value and return SEQUENCE_START', async () => {
      const mockSequence = {
        value: undefined,
        increment: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        reload: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      } as any as ChargingStationSequence;

      vi.spyOn(repository as any, 'readOrCreateByQuery').mockResolvedValue([mockSequence, false]);

      const result = await repository.getNextSequenceValue(tenantId, stationId, sequenceType);

      expect(result).toBe(1); // SEQUENCE_START
    });

    it('should handle invalid string and return SEQUENCE_START', async () => {
      const mockSequence = {
        value: 'invalid' as string | number,
        increment: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        reload: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      } as any as ChargingStationSequence;

      vi.spyOn(repository as any, 'readOrCreateByQuery').mockResolvedValue([mockSequence, false]);

      const result = await repository.getNextSequenceValue(tenantId, stationId, sequenceType);

      expect(result).toBe(1); // SEQUENCE_START (fallback for NaN)
    });

    it('should call readOrCreateByQuery with correct parameters', async () => {
      const mockSequence = {
        value: '1' as string | number,
      } as ChargingStationSequence;

      const readOrCreateSpy = vi
        .spyOn(repository as any, 'readOrCreateByQuery')
        .mockResolvedValue([mockSequence, true]);

      await repository.getNextSequenceValue(tenantId, stationId, sequenceType);

      expect(readOrCreateSpy).toHaveBeenCalledWith(tenantId, {
        where: {
          tenantId: tenantId,
          stationId: stationId,
          type: sequenceType,
        },
        defaults: {
          value: 1,
        },
        transaction: mockTransaction,
      });
    });
  });
});
