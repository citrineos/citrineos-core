// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ConnectorErrorCode,
  ConnectorFormatEnum,
  ConnectorPowerType,
  ConnectorStatus,
  ConnectorTypeEnum,
  IBaseDto,
  IChargingStationDto,
  IEvseDto,
  ITariffDto,
} from '../..';

export interface IConnectorDto extends IBaseDto {
  id?: number;
  stationId: string;
  evseId: number;
  connectorId: number;
  evseTypeConnectorId?: number;
  status?: ConnectorStatus | null;
  type?: ConnectorTypeEnum | null;
  format?: ConnectorFormatEnum | null;
  errorCode?: ConnectorErrorCode | null;
  powerType?: ConnectorPowerType | null;
  maximumAmperage?: number | null;
  maximumVoltage?: number | null;
  maximumPowerWatts?: number | null;
  timestamp: string;
  info?: string | null;
  vendorId?: string | null;
  vendorErrorCode?: string | null;
  termsAndConditionsUrl?: string | null;
  evse?: IEvseDto;
  chargingStation?: IChargingStationDto;
  tariffs?: ITariffDto[] | null;
}

export enum ConnectorDtoProps {
  id = 'id',
  stationId = 'stationId',
  evseId = 'evseId',
  connectorId = 'connectorId',
  evseTypeConnectorId = 'evseTypeConnectorId',
  status = 'status',
  errorCode = 'errorCode',
  timestamp = 'timestamp',
  info = 'info',
  vendorId = 'vendorId',
  vendorErrorCode = 'vendorErrorCode',
  evse = 'evse',
  type = 'type',
  format = 'format',
  powerType = 'powerType',
  maximumAmperage = 'maximumAmperage',
  maximumVoltage = 'maximumVoltage',
  maximumPowerWatts = 'maximumPowerWatts',
  termsAndConditionsUrl = 'termsAndConditionsUrl',
  tariffs = 'tariffs',
}
