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

  constructor(stationId: string, timestamp: string, connectorStatus: OCPP2_0_1.ConnectorStatusEnumType, evseId: number, connectorId: number, customData?: OCPP2_0_1.CustomDataType | null) {
    super();
    this.timestamp = timestamp;
    this.connectorStatus = connectorStatus;
    this.evseId = evseId;
    this.connectorId = connectorId;
    this.stationId = stationId;
    this.customData = customData;
    this.validate();
  }

  toModel(): StatusNotification {
    return StatusNotification.build({
      timestamp: this.timestamp,
      connectorStatus: this.connectorStatus,
      evseId: this.evseId,
      connectorId: this.connectorId,
      customData: this.customData,
      stationId: this.stationId,
    });
  }

  static fromModel(statusNotification: StatusNotification): StatusNotificationMapper {
    return new StatusNotificationMapper(
      statusNotification.stationId,
      statusNotification.timestamp as string,
      statusNotification.connectorStatus as OCPP2_0_1.ConnectorStatusEnumType,
      statusNotification.evseId as number,
      statusNotification.connectorId,
      statusNotification.customData as OCPP2_0_1.CustomDataType,
    );
  }

  static fromRequest(stationId: string, statusNotification: OCPP2_0_1.StatusNotificationRequest): StatusNotificationMapper {
    return new StatusNotificationMapper(
      stationId,
      statusNotification.timestamp as string,
      statusNotification.connectorStatus as OCPP2_0_1.ConnectorStatusEnumType,
      statusNotification.evseId as number,
      statusNotification.connectorId,
      statusNotification.customData,
    );
  }
}
