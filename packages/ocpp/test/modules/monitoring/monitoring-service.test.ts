// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type IVariableMonitoringRepository } from '@citrineos/dal';
import { MonitoringService } from '@modules/monitoring/monitoring-service.js';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/types';
import { aClearMonitoringResult } from './providers/monitoring.js';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

describe('MonitoringService', () => {
  const { container } = createTestContainer();
  let mockVariableMonitoringRepository: Mocked<IVariableMonitoringRepository>;
  let monitoringService: MonitoringService;

  beforeEach(() => {
    mockVariableMonitoringRepository = {
      rejectVariableMonitoringByIdAndStationId: vi.fn(),
    } as unknown as Mocked<IVariableMonitoringRepository>;

    monitoringService = getTestInstance(container, MonitoringService, {
      variableMonitoringRepository: mockVariableMonitoringRepository,
    });
  });

  describe('processClearMonitoringResult', () => {
    it('should reject variable monitoring because clear monitoring result status is either Accepted or NotFound', async () => {
      const monitoringResults: [
        OCPP2_0_1.ClearMonitoringResultType,
        ...OCPP2_0_1.ClearMonitoringResultType[],
      ] = [
        aClearMonitoringResult(),
        aClearMonitoringResult(
          (cmr) => (cmr.status = OCPP2_0_1.ClearMonitoringStatusEnumType.NotFound),
        ),
      ];

      await monitoringService.processClearMonitoringResult(
        DEFAULT_TENANT_ID,
        'ocppConnectionName',
        monitoringResults,
      );

      expect(
        mockVariableMonitoringRepository.rejectVariableMonitoringByIdAndStationId,
      ).toHaveBeenCalledTimes(monitoringResults.length);
    });

    it('should not reject variable monitoring because  clear monitoring result status is Rejected (so neither Accepted nor NotFound)', async () => {
      const monitoringResults: [
        OCPP2_0_1.ClearMonitoringResultType,
        ...OCPP2_0_1.ClearMonitoringResultType[],
      ] = [
        aClearMonitoringResult(
          (cmr) => (cmr.status = OCPP2_0_1.ClearMonitoringStatusEnumType.Rejected),
        ),
      ];

      await monitoringService.processClearMonitoringResult(
        DEFAULT_TENANT_ID,
        'ocppConnectionName',
        monitoringResults,
      );

      expect(
        mockVariableMonitoringRepository.rejectVariableMonitoringByIdAndStationId,
      ).not.toHaveBeenCalled();
    });
  });
});
