// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ConnectorErrorCodeEnum, ConnectorStatusEnum, OCPP1_6 } from '@citrineos/base';
import { describe, expect, it } from 'vitest';
import { LocationMapper } from '../../../../../src/layers/sequelize/mapper/1.6';

describe('LocationMapper', () => {
  describe('mapStatusNotificationRequestStatusToConnectorStatus', () => {
    it('should correctly map all StatusNotificationRequestStatus values', () => {
      const testCases = [
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Available,
          expected: ConnectorStatusEnum.Available,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Preparing,
          expected: ConnectorStatusEnum.Preparing,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Charging,
          expected: ConnectorStatusEnum.Charging,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.SuspendedEVSE,
          expected: ConnectorStatusEnum.SuspendedEVSE,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.SuspendedEV,
          expected: ConnectorStatusEnum.SuspendedEV,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Finishing,
          expected: ConnectorStatusEnum.Finishing,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Reserved,
          expected: ConnectorStatusEnum.Reserved,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Unavailable,
          expected: ConnectorStatusEnum.Unavailable,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Faulted,
          expected: ConnectorStatusEnum.Faulted,
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
      expect(result).toBe(ConnectorStatusEnum.Unknown);
    });
  });

  describe('mapStatusNotificationRequestErrorCodeToConnectorErrorCode', () => {
    it('should correctly map all StatusNotificationRequestErrorCode values', () => {
      const testCases = [
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ConnectorLockFailure,
          expected: ConnectorErrorCodeEnum.ConnectorLockFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.EVCommunicationError,
          expected: ConnectorErrorCodeEnum.EVCommunicationError,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.GroundFailure,
          expected: ConnectorErrorCodeEnum.GroundFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.HighTemperature,
          expected: ConnectorErrorCodeEnum.HighTemperature,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.InternalError,
          expected: ConnectorErrorCodeEnum.InternalError,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.LocalListConflict,
          expected: ConnectorErrorCodeEnum.LocalListConflict,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.NoError,
          expected: ConnectorErrorCodeEnum.NoError,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OtherError,
          expected: ConnectorErrorCodeEnum.OtherError,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OverCurrentFailure,
          expected: ConnectorErrorCodeEnum.OverCurrentFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.PowerMeterFailure,
          expected: ConnectorErrorCodeEnum.PowerMeterFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.PowerSwitchFailure,
          expected: ConnectorErrorCodeEnum.PowerSwitchFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ReaderFailure,
          expected: ConnectorErrorCodeEnum.ReaderFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ResetFailure,
          expected: ConnectorErrorCodeEnum.ResetFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.UnderVoltage,
          expected: ConnectorErrorCodeEnum.UnderVoltage,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OverVoltage,
          expected: ConnectorErrorCodeEnum.OverVoltage,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.WeakSignal,
          expected: ConnectorErrorCodeEnum.WeakSignal,
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
