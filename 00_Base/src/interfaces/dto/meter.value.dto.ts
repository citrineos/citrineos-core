// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { ISampledValueDto } from './sampled.value.dto';

export interface IMeterValueDto extends IBaseDto {
  id: number;
  transactionEventId?: number | null;
  transactionDatabaseId?: number | null;
  sampledValue: ISampledValueDto[];
  timestamp: Date;
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
