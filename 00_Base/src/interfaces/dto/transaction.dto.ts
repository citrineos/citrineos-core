// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { IEvseDto } from './evse.dto';
import { IChargingStationDto } from './charging.station.dto';
import { ITransactionEventDto } from './transaction.event.dto';

export interface ITransactionDto extends IBaseDto {
  id: number;
  transactionId: string;
  stationId: string;
  transactionEvents?: ITransactionEventDto[];
  chargingStation?: IChargingStationDto;
  evse?: IEvseDto;
  evseDatabaseId?: number;
  isActive: boolean;
  meterValues?: any[];
  startTransaction?: any;
  stopTransaction?: any;
  chargingState?: any;
  timeSpentCharging?: number | null;
  totalKwh?: number | null;
  stoppedReason?: any;
  remoteStartId?: number | null;
  totalCost?: number;
}

export enum TransactionDtoProps {
  id = 'id',
  transactionId = 'transactionId',
  stationId = 'stationId',
  chargingStation = 'ChargingStation',
  transactionEvents = 'TransactionEvents',
  evseDatabaseId = 'evseDatabaseId',
  isActive = 'isActive',
  meterValues = 'meterValues',
  startTransaction = 'StartTransaction',
  stopTransaction = 'stopTransaction',
  chargingState = 'chargingState',
  timeSpentCharging = 'timeSpentCharging',
  totalKwh = 'totalKwh',
  stoppedReason = 'stoppedReason',
  remoteStartId = 'remoteStartId',
  totalCost = 'totalCost',
  evse = 'evse',
}
