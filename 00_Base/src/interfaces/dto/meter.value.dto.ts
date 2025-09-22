// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IBaseDto } from './base.dto.js';
import type { SampledValue } from './json/index.js';

export interface IMeterValueDto extends IBaseDto {
  id?: number;
  transactionEventId?: number | null;
  transactionDatabaseId?: number | null;
  sampledValue: [SampledValue, ...SampledValue[]];
  timestamp: string; // ISO 8601 format
  connectorId?: number | null;
  tariffId?: number | null;
  transactionId?: string | null;
}

export enum MeterValueDtoProps {
  id = 'id',
  transactionEventId = 'transactionEventId',
  transactionDatabaseId = 'transactionDatabaseId',
  sampledValue = 'sampledValue',
  timestamp = 'timestamp',
  connectorId = 'connectorId',
  tariffId = 'tariffId',
  transactionId = 'transactionId',
}
