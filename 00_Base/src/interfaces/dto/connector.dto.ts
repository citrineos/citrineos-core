// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';

export interface IConnectorDto extends IBaseDto {
  id: number;
  stationId: string;
  connectorId: number;
  status?: any;
  errorCode?: any;
  info?: string;
  vendorId?: string;
  vendorErrorCode?: string;
}

export enum ConnectorDtoProps {
  id = 'id',
  stationId = 'stationId',
  connectorId = 'connectorId',
}
