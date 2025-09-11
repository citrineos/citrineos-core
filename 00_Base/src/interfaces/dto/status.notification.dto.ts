// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IBaseDto } from './base.dto';

export interface IStatusNotificationDto extends IBaseDto {
  id?: number;
  stationId: string;
  evseId?: number | null;
  connectorId: number;
  timestamp?: string | null; // ISO 8601 format
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
