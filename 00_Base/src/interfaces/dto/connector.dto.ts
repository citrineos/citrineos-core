// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto, IEvseDto } from '../..';

export interface IConnectorDto extends IBaseDto {
  id?: number;
  stationId: string;
  evseId: string;
  connectorId: number;
  evseTypeConnectorId?: number;
  status?: any;
  errorCode?: any;
  timestamp: string;
  info?: string | null;
  vendorId?: string | null;
  vendorErrorCode?: string | null;
  evse?: IEvseDto;
}

export enum ConnectorDtoProps {
  id = 'id',
  stationId = 'stationId',
  evseId = 'evseId',
  connectorId = 'connectorId',
  evseTypeConnectorId = 'evseTypeConnectorId',
  status = 'status',
  errorCode = 'errorCode',
  timestamp = 'timestamp',
  info = 'info',
  vendorId = 'vendorId',
  vendorErrorCode = 'vendorErrorCode',
  evse = 'evse',
}
