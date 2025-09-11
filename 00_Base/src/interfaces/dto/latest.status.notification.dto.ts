// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from './base.dto';

export interface ILatestStatusNotificationDto extends IBaseDto {
  id?: number;
  stationId: string;
  statusNotificationId: number;
  statusNotification?: any;
}

export enum LatestStatusNotificationDtoProps {
  id = 'id',
  stationId = 'stationId',
  statusNotificationId = 'statusNotificationId',
  statusNotification = 'statusNotification',
}
