// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ConnectorErrorCode, ConnectorStatus, OCPP1_6 } from '@citrineos/base';

export class LocationMapper {
  static mapStatusNotificationRequestStatusToConnectorStatus(
    status: OCPP1_6.StatusNotificationRequestStatus,
  ): ConnectorStatus {
    switch (status) {
      case OCPP1_6.StatusNotificationRequestStatus.Available:
        return ConnectorStatus.Available;
      case OCPP1_6.StatusNotificationRequestStatus.Preparing:
        return ConnectorStatus.Preparing;
      case OCPP1_6.StatusNotificationRequestStatus.Charging:
        return ConnectorStatus.Charging;
      case OCPP1_6.StatusNotificationRequestStatus.SuspendedEVSE:
        return ConnectorStatus.SuspendedEVSE;
      case OCPP1_6.StatusNotificationRequestStatus.SuspendedEV:
        return ConnectorStatus.SuspendedEV;
      case OCPP1_6.StatusNotificationRequestStatus.Finishing:
        return ConnectorStatus.Finishing;
      case OCPP1_6.StatusNotificationRequestStatus.Reserved:
        return ConnectorStatus.Reserved;
      case OCPP1_6.StatusNotificationRequestStatus.Unavailable:
        return ConnectorStatus.Unavailable;
      case OCPP1_6.StatusNotificationRequestStatus.Faulted:
        return ConnectorStatus.Faulted;
      default:
        return ConnectorStatus.Unknown;
    }
  }

  static mapStatusNotificationRequestErrorCodeToConnectorErrorCode(
    errorCode: OCPP1_6.StatusNotificationRequestErrorCode,
  ): ConnectorErrorCode {
    switch (errorCode) {
      case OCPP1_6.StatusNotificationRequestErrorCode.ConnectorLockFailure:
        return ConnectorErrorCode.ConnectorLockFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.EVCommunicationError:
        return ConnectorErrorCode.EVCommunicationError;
      case OCPP1_6.StatusNotificationRequestErrorCode.GroundFailure:
        return ConnectorErrorCode.GroundFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.HighTemperature:
        return ConnectorErrorCode.HighTemperature;
      case OCPP1_6.StatusNotificationRequestErrorCode.InternalError:
        return ConnectorErrorCode.InternalError;
      case OCPP1_6.StatusNotificationRequestErrorCode.LocalListConflict:
        return ConnectorErrorCode.LocalListConflict;
      case OCPP1_6.StatusNotificationRequestErrorCode.NoError:
        return ConnectorErrorCode.NoError;
      case OCPP1_6.StatusNotificationRequestErrorCode.OtherError:
        return ConnectorErrorCode.OtherError;
      case OCPP1_6.StatusNotificationRequestErrorCode.OverCurrentFailure:
        return ConnectorErrorCode.OverCurrentFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.PowerMeterFailure:
        return ConnectorErrorCode.PowerMeterFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.PowerSwitchFailure:
        return ConnectorErrorCode.PowerSwitchFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.ReaderFailure:
        return ConnectorErrorCode.ReaderFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.ResetFailure:
        return ConnectorErrorCode.ResetFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.UnderVoltage:
        return ConnectorErrorCode.UnderVoltage;
      case OCPP1_6.StatusNotificationRequestErrorCode.OverVoltage:
        return ConnectorErrorCode.OverVoltage;
      case OCPP1_6.StatusNotificationRequestErrorCode.WeakSignal:
        return ConnectorErrorCode.WeakSignal;
      default:
        throw new Error(`Unknown StatusNotificationRequestErrorCode: ${errorCode}`);
    }
  }
}
