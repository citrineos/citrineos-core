// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';

export interface IStatusNotificationDto extends IBaseDto {
  id: number;
  stationId: string;
  evseId?: number;
  connectorId: number;
  timestamp: string;
  connectorStatus: any; // Use ConnectorStatusEnumType if available
}

export enum StatusNotificationDtoProps {
  id = 'id',
  stationId = 'stationId',
  evseId = 'evseId',
  connectorId = 'connectorId',
  timestamp = 'timestamp',
  connectorStatus = 'connectorStatus',
}
