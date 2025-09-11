// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from './base.dto';
import { IConnectorDto } from './connector.dto';

export interface IStartTransactionDto extends IBaseDto {
  id?: number;
  stationId: string;
  meterStart: number;
  timestamp: string; // ISO 8601 format
  reservationId?: number | null;
  transactionDatabaseId?: number;
  idTokenDatabaseId?: number | null;
  connectorDatabaseId: number;
  connector?: IConnectorDto;
}

export enum StartTransactionDtoProps {
  id = 'id',
  stationId = 'stationId',
  meterStart = 'meterStart',
  timestamp = 'timestamp',
  reservationId = 'reservationId',
  transactionDatabaseId = 'transactionDatabaseId',
  idTokenDatabaseId = 'idTokenDatabaseId',
  connectorDatabaseId = 'connectorDatabaseId',
  connector = 'connector',
}
