// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingStationSchema } from './charging.station.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { ConnectorStatusEnumSchema } from './types/enums.js';

export const StatusNotificationSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  timestamp: z.iso.datetime().nullable().optional(),
  connectorStatus: ConnectorStatusEnumSchema,
  evseId: z.number().int().nullable().optional(),
  connectorId: z.number().int(),
  errorCode: z.string().nullable().optional(),
  info: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  vendorErrorCode: z.string().nullable().optional(),
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
