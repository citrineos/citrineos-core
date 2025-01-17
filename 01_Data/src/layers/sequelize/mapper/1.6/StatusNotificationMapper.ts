// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { StatusNotification } from '../../model/Location';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

export class StatusNotificationMapper extends AbstractMapper {
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

  constructor(statusNotification: StatusNotification) {
    super();
    this.timestamp = statusNotification.timestamp;
    this.status = statusNotification.connectorStatus as OCPP1_6.StatusNotificationRequestStatus;
    this.connectorId = statusNotification.connectorId;
    this.stationId = statusNotification.stationId;
    this.errorCode = statusNotification.errorCode as OCPP1_6.StatusNotificationRequestErrorCode;
    this.info = statusNotification.info;
    this.vendorId = statusNotification.vendorId;
    this.vendorErrorCode = statusNotification.vendorErrorCode;
    this.validate();
  }

  toModel(): StatusNotification {
    return {
      timestamp: this.timestamp,
      connectorStatus: this.status,
      connectorId: this.connectorId,
      stationId: this.stationId,
      errorCode: this.errorCode,
      info: this.info,
      vendorId: this.vendorId,
      vendorErrorCode: this.vendorErrorCode,
    } as StatusNotification;
  }
}
