// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  IAuthorizationDto,
  IBaseDto,
  IChargingStationDto,
  IConnectorDto,
  IEvseDto,
  ILocationDto,
  IMeterValueDto,
  IStartTransactionDto,
  IStopTransactionDto,
  ITariffDto,
  ITransactionEventDto,
} from '../..';

export interface ITransactionDto extends IBaseDto {
  id?: number;
  transactionId: string;
  stationId: string;
  transactionEvents?: ITransactionEventDto[];
  chargingStation?: IChargingStationDto;
  evse?: IEvseDto | null;
  evseId?: number;
  isActive: boolean;
  meterValues?: IMeterValueDto[];
  startTransaction?: IStartTransactionDto;
  stopTransaction?: IStopTransactionDto;
  chargingState?: any;
  timeSpentCharging?: number | null;
  totalKwh?: number | null;
  stoppedReason?: any;
  remoteStartId?: number | null;
  totalCost?: number;
  locationId?: number;
  location?: ILocationDto;
  connectorId?: number;
  connector?: IConnectorDto | null;
  authorizationId?: number;
  authorization?: IAuthorizationDto;
  tariffId?: number | null;
  tariff?: ITariffDto | null;
  startTime?: string | null;
  endTime?: string | null;
  customData?: any | null;
}

export enum TransactionDtoProps {
  id = 'id',
  transactionId = 'transactionId',
  stationId = 'stationId',
  chargingStation = 'chargingStation',
  transactionEvents = 'transactionEvents',
  evseDatabaseId = 'evseDatabaseId',
  isActive = 'isActive',
  meterValues = 'meterValues',
  startTransaction = 'startTransaction',
  stopTransaction = 'stopTransaction',
  chargingState = 'chargingState',
  timeSpentCharging = 'timeSpentCharging',
  totalKwh = 'totalKwh',
  stoppedReason = 'stoppedReason',
  remoteStartId = 'remoteStartId',
  totalCost = 'totalCost',
  evse = 'evse',
  tariff = 'tariff',
  locationId = 'locationId',
  location = 'location',
  evseId = 'evseId',
  connectorId = 'connectorId',
  connector = 'connector',
  authorizationId = 'authorizationId',
  authorization = 'authorization',
  tariffId = 'tariffId',
  startTime = 'startTime',
  endTime = 'endTime',
  customData = 'customData',
}
