// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IBaseDto } from './base.dto.js';

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
