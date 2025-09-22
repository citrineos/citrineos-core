// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IBaseDto } from './base.dto.js';
import type { IConnectorDto } from './connector.dto.js';

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
