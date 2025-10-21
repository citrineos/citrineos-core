// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { z } from 'zod';
import { ChargingStationSchema } from './charging.station.dto.js';
import { StatusNotificationSchema } from './status.notification.dto.js';
import { BaseSchema } from './types/base.dto.js';

export const LatestStatusNotificationSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  statusNotificationId: z.number().int(),
  chargingStation: ChargingStationSchema.optional(),
  statusNotification: StatusNotificationSchema.optional(),
});

export const LatestStatusNotificationProps = LatestStatusNotificationSchema.keyof().enum;

export type LatestStatusNotificationDto = z.infer<typeof LatestStatusNotificationSchema>;

export const LatestStatusNotificationCreateSchema = LatestStatusNotificationSchema.omit({
  id: true,
  tenant: true,
  chargingStation: true,
  statusNotification: true,
  updatedAt: true,
  createdAt: true,
});

export type LatestStatusNotificationCreate = z.infer<typeof LatestStatusNotificationCreateSchema>;

export const latestStatusNotificationSchemas = {
  LatestStatusNotification: LatestStatusNotificationSchema,
  LatestStatusNotificationCreate: LatestStatusNotificationCreateSchema,
};
