// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ChargingStationCapability,
  ChargingStationParkingRestriction,
  IBaseDto,
  IConnectorDto,
  IEvseDto,
  ILocationDto,
  IStatusNotificationDto,
  ITransactionDto,
  OCPPVersion,
} from '../..';
import { Point } from 'geojson';

export interface IChargingStationDto extends IBaseDto {
  id: string;
  isOnline: boolean;
  protocol?: OCPPVersion | null;
  chargePointVendor?: string | null;
  chargePointModel?: string | null;
  chargePointSerialNumber?: string | null;
  chargeBoxSerialNumber?: string | null;
  firmwareVersion?: string | null;
  iccid?: string | null;
  imsi?: string | null;
  meterType?: string | null;
  meterSerialNumber?: string | null;
  coordinates?: Point | null;
  floorLevel?: string | null;
  parkingRestrictions?: ChargingStationParkingRestriction[] | null;
  capabilities?: ChargingStationCapability[] | null;
  locationId?: number | null;
  statusNotifications?: IStatusNotificationDto[] | null;
  transactions?: ITransactionDto[] | null;
  location?: ILocationDto;
  networkProfiles?: any;
  evses?: IEvseDto[] | null;
  connectors?: IConnectorDto[] | null;
}

export enum ChargingStationDtoProps {
  id = 'id',
  isOnline = 'isOnline',
  protocol = 'protocol',
  chargePointVendor = 'chargePointVendor',
  chargePointModel = 'chargePointModel',
  chargePointSerialNumber = 'chargePointSerialNumber',
  chargeBoxSerialNumber = 'chargeBoxSerialNumber',
  firmwareVersion = 'firmwareVersion',
  iccid = 'iccid',
  imsi = 'imsi',
  meterType = 'meterType',
  meterSerialNumber = 'meterSerialNumber',
  locationId = 'locationId',
  statusNotifications = 'statusNotifications',
  location = 'Location',
  networkProfiles = 'networkProfiles',
  evses = 'evses',
  connectors = 'connectors',
  coordinates = 'coordinates',
  floorLevel = 'floorLevel',
  parkingRestrictions = 'parkingRestrictions',
  capabilities = 'capabilities',
}
