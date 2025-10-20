// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ConnectorErrorCode, ConnectorStatus } from '@citrineos/base';
import { OCPP1_6 } from '@citrineos/base';
import { LocationMapper } from '../../../../../src/layers/sequelize/mapper/1.6';
import { describe, expect, it } from 'vitest';

describe('LocationMapper', () => {
  describe('mapStatusNotificationRequestStatusToConnectorStatus', () => {
    it('should correctly map all StatusNotificationRequestStatus values', () => {
      const testCases = [
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Available,
          expected: 'Available',
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Preparing,
          expected: 'Preparing',
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Charging,
          expected: 'Charging',
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.SuspendedEVSE,
          expected: 'SuspendedEVSE',
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.SuspendedEV,
          expected: 'SuspendedEV',
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Finishing,
          expected: 'Finishing',
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Reserved,
          expected: 'Reserved',
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Unavailable,
          expected: 'Unavailable',
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Faulted,
          expected: 'Faulted',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = LocationMapper.mapStatusNotificationRequestStatusToConnectorStatus(input);
        expect(result).toBe(expected);
      });
    });

    it('should return Unknown for an unknown status', () => {
      const result = LocationMapper.mapStatusNotificationRequestStatusToConnectorStatus(
        'InvalidStatus' as OCPP1_6.StatusNotificationRequestStatus,
      );
      expect(result).toBe('Unknown');
    });
  });

  describe('mapStatusNotificationRequestErrorCodeToConnectorErrorCode', () => {
    it('should correctly map all StatusNotificationRequestErrorCode values', () => {
      const testCases = [
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ConnectorLockFailure,
          expected: 'ConnectorLockFailure',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.EVCommunicationError,
          expected: 'EVCommunicationError',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.GroundFailure,
          expected: 'GroundFailure',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.HighTemperature,
          expected: 'HighTemperature',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.InternalError,
          expected: 'InternalError',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.LocalListConflict,
          expected: 'LocalListConflict',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.NoError,
          expected: 'NoError',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OtherError,
          expected: 'OtherError',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OverCurrentFailure,
          expected: 'OverCurrentFailure',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.PowerMeterFailure,
          expected: 'PowerMeterFailure',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.PowerSwitchFailure,
          expected: 'PowerSwitchFailure',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ReaderFailure,
          expected: 'ReaderFailure',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ResetFailure,
          expected: 'ResetFailure',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.UnderVoltage,
          expected: 'UnderVoltage',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OverVoltage,
          expected: 'OverVoltage',
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.WeakSignal,
          expected: 'WeakSignal',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result =
          LocationMapper.mapStatusNotificationRequestErrorCodeToConnectorErrorCode(input);
        expect(result).toBe(expected);
      });
    });

    it('should throw an error for an unknown error code', () => {
      expect(() =>
        LocationMapper.mapStatusNotificationRequestErrorCodeToConnectorErrorCode(
          'InvalidErrorCode' as OCPP1_6.StatusNotificationRequestErrorCode,
        ),
      ).toThrow('Unknown StatusNotificationRequestErrorCode: InvalidErrorCode');
    });
  });
});
