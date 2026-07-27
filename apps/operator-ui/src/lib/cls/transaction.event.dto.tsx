// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type MeterValueDto, type TransactionEventDto, OCPP2_0_1 } from '@citrineos/types';

export class TransactionEventClass implements Partial<TransactionEventDto> {
  id?: number;
  ocppConnectionName!: string;
  evseId?: number | null;
  transactionDatabaseId?: number;
  eventType!: any;
  meterValues?: MeterValueDto[];
  timestamp!: string;
  triggerReason!: OCPP2_0_1.TriggerReasonEnumType;
  seqNo!: number;
  offline?: boolean | null;
  numberOfPhasesUsed?: number | null;
  cableMaxCurrent?: number | null;
  reservationId?: number | null;
  idTokenValue?: string | null;
  idTokenType?: string | null;
  transactionInfo?: any;
}
