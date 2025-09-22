// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IBaseDto } from './base.dto.js';
import type { IMeterValueDto } from './meter.value.dto.js';

export interface IStopTransactionDto extends IBaseDto {
  id?: number;
  stationId: string;
  transactionDatabaseId?: string;
  meterStop: number;
  timestamp: string; // ISO 8601 format
  idTokenDatabaseId?: number | null;
  reason?: string;
  meterValues?: IMeterValueDto[];
}

export enum StopTransactionDtoProps {
  id = 'id',
  stationId = 'stationId',
  transactionDatabaseId = 'transactionDatabaseId',
  meterStop = 'meterStop',
  timestamp = 'timestamp',
  idTokenDatabaseId = 'idTokenDatabaseId',
  reason = 'reason',
  meterValues = 'meterValues',
}
