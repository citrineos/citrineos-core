// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';

export interface IMeterValueDto extends IBaseDto {
  id?: number;
  transactionEventId?: number | null;
  transactionDatabaseId?: number | null;
  sampledValue: any;
  timestamp: string; // ISO 8601 format
  connectorId?: number | null;
}

export enum MeterValueDtoProps {
  id = 'id',
  transactionEventId = 'transactionEventId',
  transactionDatabaseId = 'transactionDatabaseId',
  sampledValue = 'sampledValue',
  timestamp = 'timestamp',
  connectorId = 'connectorId',
}
