// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from './base.dto';
import { ILocationDto } from './location.dto';
import { ITransactionDto } from './transaction.dto';
import { IStatusNotificationDto } from './status.notification.dto';
import { ILatestStatusNotificationDto } from './latest.status.notification.dto';
import { IEvseDto } from './evse.dto';

export interface IChargingStationDto extends IBaseDto {
  id: string;
  isOnline: boolean;
  protocol?: string;
  locationId?: any;
  statusNotifications?: IStatusNotificationDto[];
  latestStatusNotifications?: ILatestStatusNotificationDto[];
  evses?: IEvseDto[];
  connectorTypes?: string[];
  transactions?: ITransactionDto[];
  ocppLogs?: any[];
  location?: ILocationDto;
  chargePointVendor?: string;
  chargePointModel?: string;
  chargePointSerialNumber?: string;
  chargeBoxSerialNumber?: string;
  firmwareVersion?: string;
  iccid?: string;
  imsi?: string;
  meterSerialNumber?: string;
}

export enum ChargingStationDtoProps {
  id = 'id',
  isOnline = 'isOnline',
  protocol = 'protocol',
  locationId = 'locationId',
  statusNotifications = 'statusNotifications',
  latestStatusNotifications = 'latestStatusNotifications',
  evses = 'evses',
  transactions = 'transactions',
  ocppLogs = 'ocppLogs',
  location = 'Location',
  chargePointVendor = 'chargePointVendor',
  chargePointModel = 'chargePointModel',
  chargePointSerialNumber = 'chargePointSerialNumber',
  chargeBoxSerialNumber = 'chargeBoxSerialNumber',
  firmwareVersion = 'firmwareVersion',
  iccid = 'iccid',
  imsi = 'imsi',
  meterSerialNumber = 'meterSerialNumber',
}
