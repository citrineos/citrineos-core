// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { IIdTokenDto } from './id.token.dto';

export interface ITransactionEventDto extends IBaseDto {
  id: number;
  stationId: string;
  evseId?: number | null;
  transactionDatabaseId?: string;
  eventType: any;
  meterValues?: any[];
  timestamp: Date;
  triggerReason: any;
  seqNo: number;
  offline?: boolean | null;
  numberOfPhasesUsed?: number | null;
  cableMaxCurrent?: number | null;
  reservationId?: number | null;
  idTokenId?: number | null;
  idToken?: IIdTokenDto;
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
  idToken = 'IdToken',
  idTokenId = 'idTokenId',
}
