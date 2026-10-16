// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingStationSchema } from './charging-station-dto.js';
import { StatusNotificationSchemaWithoutParent } from './types/status-notification.js';

export const StatusNotificationSchema = StatusNotificationSchemaWithoutParent.extend({
  chargingStation: ChargingStationSchema.optional(),
});

export const StatusNotificationProps = StatusNotificationSchema.keyof().enum;

export type StatusNotificationDto = z.infer<typeof StatusNotificationSchema>;

export const StatusNotificationCreateSchema = StatusNotificationSchema.omit({
  id: true,
  tenant: true,
  chargingStation: true,
  updatedAt: true,
  createdAt: true,
});

export type StatusNotificationCreate = z.infer<typeof StatusNotificationCreateSchema>;

export const statusNotificationSchemas = {
  StatusNotification: StatusNotificationSchema,
  StatusNotificationCreate: StatusNotificationCreateSchema,
};
