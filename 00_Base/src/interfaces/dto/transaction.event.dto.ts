// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IBaseDto } from './base.dto';
import { IMeterValueDto } from './meter.value.dto';
import { TriggerReasonEnumType } from '../../ocpp/model/2.0.1';

export interface ITransactionEventDto extends IBaseDto {
  id?: number;
  stationId: string;
  evseId?: number | null;
  transactionDatabaseId?: number;
  eventType: any;
  meterValues?: IMeterValueDto[];
  timestamp: string; // ISO 8601 format
  triggerReason: TriggerReasonEnumType;
  seqNo: number;
  offline?: boolean | null;
  numberOfPhasesUsed?: number | null;
  cableMaxCurrent?: number | null;
  reservationId?: number | null;
  idTokenValue?: string | null;
  idTokenType?: string | null;
  transactionInfo?: any;
}

export enum TransactionEventDtoProps {
  id = 'id',
  stationId = 'stationId',
  evseId = 'evseId',
  transactionDatabaseId = 'transactionDatabaseId',
  eventType = 'eventType',
  meterValues = 'meterValues',
  timestamp = 'timestamp',
  triggerReason = 'triggerReason',
  seqNo = 'seqNo',
  offline = 'offline',
  numberOfPhasesUsed = 'numberOfPhasesUsed',
  cableMaxCurrent = 'cableMaxCurrent',
  reservationId = 'reservationId',
  idTokenValue = 'IdTokenValue',
  idTokenType = 'idTokenType',
}
