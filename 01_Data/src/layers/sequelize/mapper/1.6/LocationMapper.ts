// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorErrorCodeEnumType, ConnectorStatusEnumType } from '@citrineos/base';
import { ConnectorErrorCodeEnum, ConnectorStatusEnum, OCPP1_6 } from '@citrineos/base';

export class LocationMapper {
  static mapStatusNotificationRequestStatusToConnectorStatus(
    status: OCPP1_6.StatusNotificationRequestStatus,
  ): ConnectorStatusEnumType {
    switch (status) {
      case OCPP1_6.StatusNotificationRequestStatus.Available:
        return ConnectorStatusEnum.Available;
      case OCPP1_6.StatusNotificationRequestStatus.Preparing:
        return ConnectorStatusEnum.Preparing;
      case OCPP1_6.StatusNotificationRequestStatus.Charging:
        return ConnectorStatusEnum.Charging;
      case OCPP1_6.StatusNotificationRequestStatus.SuspendedEVSE:
        return ConnectorStatusEnum.SuspendedEVSE;
      case OCPP1_6.StatusNotificationRequestStatus.SuspendedEV:
        return ConnectorStatusEnum.SuspendedEV;
      case OCPP1_6.StatusNotificationRequestStatus.Finishing:
        return ConnectorStatusEnum.Finishing;
      case OCPP1_6.StatusNotificationRequestStatus.Reserved:
        return ConnectorStatusEnum.Reserved;
      case OCPP1_6.StatusNotificationRequestStatus.Unavailable:
        return ConnectorStatusEnum.Unavailable;
      case OCPP1_6.StatusNotificationRequestStatus.Faulted:
        return ConnectorStatusEnum.Faulted;
      default:
        return ConnectorStatusEnum.Unknown;
    }
  }

  static mapStatusNotificationRequestErrorCodeToConnectorErrorCode(
    errorCode: OCPP1_6.StatusNotificationRequestErrorCode,
  ): ConnectorErrorCodeEnumType {
    switch (errorCode) {
      case OCPP1_6.StatusNotificationRequestErrorCode.ConnectorLockFailure:
        return ConnectorErrorCodeEnum.ConnectorLockFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.EVCommunicationError:
        return ConnectorErrorCodeEnum.EVCommunicationError;
      case OCPP1_6.StatusNotificationRequestErrorCode.GroundFailure:
        return ConnectorErrorCodeEnum.GroundFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.HighTemperature:
        return ConnectorErrorCodeEnum.HighTemperature;
      case OCPP1_6.StatusNotificationRequestErrorCode.InternalError:
        return ConnectorErrorCodeEnum.InternalError;
      case OCPP1_6.StatusNotificationRequestErrorCode.LocalListConflict:
        return ConnectorErrorCodeEnum.LocalListConflict;
      case OCPP1_6.StatusNotificationRequestErrorCode.NoError:
        return ConnectorErrorCodeEnum.NoError;
      case OCPP1_6.StatusNotificationRequestErrorCode.OtherError:
        return ConnectorErrorCodeEnum.OtherError;
      case OCPP1_6.StatusNotificationRequestErrorCode.OverCurrentFailure:
        return ConnectorErrorCodeEnum.OverCurrentFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.PowerMeterFailure:
        return ConnectorErrorCodeEnum.PowerMeterFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.PowerSwitchFailure:
        return ConnectorErrorCodeEnum.PowerSwitchFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.ReaderFailure:
        return ConnectorErrorCodeEnum.ReaderFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.ResetFailure:
        return ConnectorErrorCodeEnum.ResetFailure;
      case OCPP1_6.StatusNotificationRequestErrorCode.UnderVoltage:
        return ConnectorErrorCodeEnum.UnderVoltage;
      case OCPP1_6.StatusNotificationRequestErrorCode.OverVoltage:
        return ConnectorErrorCodeEnum.OverVoltage;
      case OCPP1_6.StatusNotificationRequestErrorCode.WeakSignal:
        return ConnectorErrorCodeEnum.WeakSignal;
      default:
        throw new Error(`Unknown StatusNotificationRequestErrorCode: ${errorCode}`);
    }
  }
}
