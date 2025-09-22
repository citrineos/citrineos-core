// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ConnectorErrorCode, ConnectorStatus, OCPP1_6 } from '@citrineos/base';
import { LocationMapper } from '../../../../../src/layers/sequelize/mapper/1.6';

describe('LocationMapper', () => {
  describe('mapStatusNotificationRequestStatusToConnectorStatus', () => {
    it('should correctly map all StatusNotificationRequestStatus values', () => {
      const testCases = [
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Available,
          expected: ConnectorStatus.Available,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Preparing,
          expected: ConnectorStatus.Preparing,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Charging,
          expected: ConnectorStatus.Charging,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.SuspendedEVSE,
          expected: ConnectorStatus.SuspendedEVSE,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.SuspendedEV,
          expected: ConnectorStatus.SuspendedEV,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Finishing,
          expected: ConnectorStatus.Finishing,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Reserved,
          expected: ConnectorStatus.Reserved,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Unavailable,
          expected: ConnectorStatus.Unavailable,
        },
        {
          input: OCPP1_6.StatusNotificationRequestStatus.Faulted,
          expected: ConnectorStatus.Faulted,
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
      expect(result).toBe(ConnectorStatus.Unknown);
    });
  });

  describe('mapStatusNotificationRequestErrorCodeToConnectorErrorCode', () => {
    it('should correctly map all StatusNotificationRequestErrorCode values', () => {
      const testCases = [
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ConnectorLockFailure,
          expected: ConnectorErrorCode.ConnectorLockFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.EVCommunicationError,
          expected: ConnectorErrorCode.EVCommunicationError,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.GroundFailure,
          expected: ConnectorErrorCode.GroundFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.HighTemperature,
          expected: ConnectorErrorCode.HighTemperature,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.InternalError,
          expected: ConnectorErrorCode.InternalError,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.LocalListConflict,
          expected: ConnectorErrorCode.LocalListConflict,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.NoError,
          expected: ConnectorErrorCode.NoError,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OtherError,
          expected: ConnectorErrorCode.OtherError,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OverCurrentFailure,
          expected: ConnectorErrorCode.OverCurrentFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.PowerMeterFailure,
          expected: ConnectorErrorCode.PowerMeterFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.PowerSwitchFailure,
          expected: ConnectorErrorCode.PowerSwitchFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ReaderFailure,
          expected: ConnectorErrorCode.ReaderFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.ResetFailure,
          expected: ConnectorErrorCode.ResetFailure,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.UnderVoltage,
          expected: ConnectorErrorCode.UnderVoltage,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.OverVoltage,
          expected: ConnectorErrorCode.OverVoltage,
        },
        {
          input: OCPP1_6.StatusNotificationRequestErrorCode.WeakSignal,
          expected: ConnectorErrorCode.WeakSignal,
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
