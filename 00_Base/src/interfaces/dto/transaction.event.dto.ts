// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { IMeterValueDto } from './meter.value.dto';
import { TriggerReasonEnumType } from '../../ocpp/model/2.0.1';

export interface ITransactionEventDto extends IBaseDto {
  id?: number;
  stationId: string;
  evseId?: number | null;
  transactionDatabaseId?: string;
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
  // transactionInfo?: any; // Uncomment and type if needed
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
