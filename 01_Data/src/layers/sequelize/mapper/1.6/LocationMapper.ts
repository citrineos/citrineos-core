// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorErrorCode, ConnectorStatus } from '@citrineos/base';
import { OCPP1_6 } from '@citrineos/base';

export class LocationMapper {
  static mapStatusNotificationRequestStatusToConnectorStatus(
    status: OCPP1_6.StatusNotificationRequestStatus,
  ): string {
    switch (status) {
      case OCPP1_6.StatusNotificationRequestStatus.Available:
        return 'Available';
      case OCPP1_6.StatusNotificationRequestStatus.Preparing:
        return 'Preparing';
      case OCPP1_6.StatusNotificationRequestStatus.Charging:
        return 'Charging';
      case OCPP1_6.StatusNotificationRequestStatus.SuspendedEVSE:
        return 'SuspendedEVSE';
      case OCPP1_6.StatusNotificationRequestStatus.SuspendedEV:
        return 'SuspendedEV';
      case OCPP1_6.StatusNotificationRequestStatus.Finishing:
        return 'Finishing';
      case OCPP1_6.StatusNotificationRequestStatus.Reserved:
        return 'Reserved';
      case OCPP1_6.StatusNotificationRequestStatus.Unavailable:
        return 'Unavailable';
      case OCPP1_6.StatusNotificationRequestStatus.Faulted:
        return 'Faulted';
      default:
        return 'Unknown';
    }
  }

  static mapStatusNotificationRequestErrorCodeToConnectorErrorCode(
    errorCode: OCPP1_6.StatusNotificationRequestErrorCode,
  ): string {
    switch (errorCode) {
      case OCPP1_6.StatusNotificationRequestErrorCode.ConnectorLockFailure:
        return 'ConnectorLockFailure';
      case OCPP1_6.StatusNotificationRequestErrorCode.EVCommunicationError:
        return 'EVCommunicationError';
      case OCPP1_6.StatusNotificationRequestErrorCode.GroundFailure:
        return 'GroundFailure';
      case OCPP1_6.StatusNotificationRequestErrorCode.HighTemperature:
        return 'HighTemperature';
      case OCPP1_6.StatusNotificationRequestErrorCode.InternalError:
        return 'InternalError';
      case OCPP1_6.StatusNotificationRequestErrorCode.LocalListConflict:
        return 'LocalListConflict';
      case OCPP1_6.StatusNotificationRequestErrorCode.NoError:
        return 'NoError';
      case OCPP1_6.StatusNotificationRequestErrorCode.OtherError:
        return 'OtherError';
      case OCPP1_6.StatusNotificationRequestErrorCode.OverCurrentFailure:
        return 'OverCurrentFailure';
      case OCPP1_6.StatusNotificationRequestErrorCode.PowerMeterFailure:
        return 'PowerMeterFailure';
      case OCPP1_6.StatusNotificationRequestErrorCode.PowerSwitchFailure:
        return 'PowerSwitchFailure';
      case OCPP1_6.StatusNotificationRequestErrorCode.ReaderFailure:
        return 'ReaderFailure';
      case OCPP1_6.StatusNotificationRequestErrorCode.ResetFailure:
        return 'ResetFailure';
      case OCPP1_6.StatusNotificationRequestErrorCode.UnderVoltage:
        return 'UnderVoltage';
      case OCPP1_6.StatusNotificationRequestErrorCode.OverVoltage:
        return 'OverVoltage';
      case OCPP1_6.StatusNotificationRequestErrorCode.WeakSignal:
        return 'WeakSignal';
      default:
        throw new Error(`Unknown StatusNotificationRequestErrorCode: ${errorCode}`);
    }
  }
}
