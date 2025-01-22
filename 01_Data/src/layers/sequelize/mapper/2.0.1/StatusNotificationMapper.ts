// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { StatusNotification } from '../../model/Location';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

export class StatusNotificationMapper extends AbstractMapper<StatusNotification> {
  @IsNotEmpty()
  timestamp: string;
  @IsEnum(OCPP2_0_1.ConnectorStatusEnumType)
  connectorStatus: OCPP2_0_1.ConnectorStatusEnumType;
  @IsInt()
  @IsNotEmpty()
  evseId: number;
  @IsInt()
  connectorId: number;
  customData?: OCPP2_0_1.CustomDataType | null;
  stationId: string;

  constructor(statusNotification: StatusNotification) {
    super();
    this.timestamp = statusNotification.timestamp as string;
    this.connectorStatus = statusNotification.connectorStatus as OCPP2_0_1.ConnectorStatusEnumType;
    this.evseId = statusNotification.evseId as number;
    this.connectorId = statusNotification.connectorId;
    this.stationId = statusNotification.stationId;
    this.customData = statusNotification.customData as OCPP2_0_1.CustomDataType;
    this.validate();
  }

  toModel(): StatusNotification {
    return {
      stationId: this.stationId,
      timestamp: this.timestamp,
      connectorStatus: this.connectorStatus,
      evseId: this.evseId,
      connectorId: this.connectorId,
      customData: this.customData,
    } as StatusNotification;
  }
}
