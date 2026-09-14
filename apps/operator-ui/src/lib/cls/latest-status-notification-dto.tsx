// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LatestStatusNotificationDto, StatusNotificationDto } from '@citrineos/types';
import { Expose } from 'class-transformer';

export class LatestStatusNotificationClass implements Partial<LatestStatusNotificationDto> {
  @Expose({ name: 'StatusNotification' })
  statusNotification?: StatusNotificationDto;
}
