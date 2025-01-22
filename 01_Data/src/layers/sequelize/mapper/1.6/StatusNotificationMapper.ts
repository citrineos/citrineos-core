// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { StatusNotification } from '../../model/Location';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

export class StatusNotificationMapper extends AbstractMapper<StatusNotification> {
  timestamp?: string | null;
  @IsEnum(OCPP1_6.StatusNotificationRequestStatus)
  status: OCPP1_6.StatusNotificationRequestStatus;
  @IsInt()
  connectorId: number;
  stationId: string;
  @IsNotEmpty()
  @IsEnum(OCPP1_6.StatusNotificationRequestErrorCode)
  errorCode: OCPP1_6.StatusNotificationRequestErrorCode;
  info?: string | null;
  vendorId?: string | null;
  vendorErrorCode?: string | null;

  constructor(
    stationId: string,
    status: OCPP1_6.StatusNotificationRequestStatus,
    connectorId: number,
    errorCode: OCPP1_6.StatusNotificationRequestErrorCode,
    timestamp?: string | null,
    info?: string | null,
    vendorId?: string | null,
    vendorErrorCode?: string | null,
  ) {
    super();
    this.timestamp = timestamp;
    this.status = status;
    this.connectorId = connectorId;
    this.stationId = stationId;
    this.errorCode = errorCode;
    this.info = info;
    this.vendorId = vendorId;
    this.vendorErrorCode = vendorErrorCode;
    this.validate();
  }

  toModel(): StatusNotification {
    return StatusNotification.build({
      timestamp: this.timestamp,
      status: this.status,
      connectorId: this.connectorId,
      stationId: this.stationId,
      errorCode: this.errorCode,
      info: this.info,
      vendorId: this.vendorId,
      vendorErrorCode: this.vendorErrorCode,
    });
  }

  static fromModel(statusNotification: StatusNotification): StatusNotificationMapper {
    return new StatusNotificationMapper(
      statusNotification.stationId,
      statusNotification.connectorStatus as OCPP1_6.StatusNotificationRequestStatus,
      statusNotification.connectorId,
      statusNotification.errorCode as OCPP1_6.StatusNotificationRequestErrorCode,
      statusNotification.timestamp,
      statusNotification.info,
      statusNotification.vendorId,
      statusNotification.vendorErrorCode,
    );
  }

  static fromRequest(stationId: string, statusNotification: OCPP1_6.StatusNotificationRequest): StatusNotificationMapper {
    return new StatusNotificationMapper(
      stationId,
      statusNotification.status,
      statusNotification.connectorId,
      statusNotification.errorCode,
      statusNotification.timestamp,
      statusNotification.info,
      statusNotification.vendorId,
      statusNotification.vendorErrorCode,
    );
  }
}
