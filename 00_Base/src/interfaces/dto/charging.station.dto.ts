// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ConnectorSchema } from './connector.dto.js';
import { EvseSchema } from './evse.dto.js';
import { BaseSchema } from './types/base.dto.js';
import {
  ChargingStationCapabilitySchema,
  ChargingStationParkingRestrictionSchema,
} from './types/enums.js';
import { PointSchema } from './types/location.js';
import { OCPPVersionSchema } from './types/ocpp.message.js';

export const ChargingStationSchema = BaseSchema.extend({
  id: z.string().max(36),
  isOnline: z.boolean(),
  protocol: OCPPVersionSchema.nullable().optional(),
  chargePointVendor: z.string().max(20).nullable().optional(),
  chargePointModel: z.string().max(20).nullable().optional(),
  chargePointSerialNumber: z.string().max(25).nullable().optional(),
  chargeBoxSerialNumber: z.string().max(25).nullable().optional(),
  firmwareVersion: z.string().max(50).nullable().optional(),
  iccid: z.string().max(20).nullable().optional(),
  imsi: z.string().max(20).nullable().optional(),
  meterType: z.string().max(25).nullable().optional(),
  meterSerialNumber: z.string().max(25).nullable().optional(),
  coordinates: PointSchema.nullable().optional(),
  floorLevel: z.string().nullable().optional(),
  parkingRestrictions: z.array(ChargingStationParkingRestrictionSchema).nullable().optional(),
  capabilities: z.array(ChargingStationCapabilitySchema).nullable().optional(),
  locationId: z.number().int().nullable().optional(),
  networkProfiles: z.any().optional(),
  evses: z.array(EvseSchema).nullable().optional(),
  connectors: z.array(ConnectorSchema).nullable().optional(),
});

export const ChargingStationProps = ChargingStationSchema.keyof().enum;

export type ChargingStationDto = z.infer<typeof ChargingStationSchema>;

export const ChargingStationCreateSchema = ChargingStationSchema.omit({
  tenant: true,
  statusNotifications: true,
  transactions: true,
  location: true,
  networkProfiles: true,
  evses: true,
  connectors: true,
  updatedAt: true,
  createdAt: true,
});

export type ChargingStationCreate = z.infer<typeof ChargingStationCreateSchema>;

// OCPI-specific validation (requires evses and connectors)
export const ChargingStationOCPISchema = ChargingStationSchema.extend({
  evses: z.array(EvseSchema).min(1, 'OCPI requires at least one EVSE'),
  connectors: z.array(ConnectorSchema).min(1, 'OCPI requires at least one connector'),
  coordinates: PointSchema, // Required for OCPI (not nullable)
});

export type ChargingStationOCPI = z.infer<typeof ChargingStationOCPISchema>;

export const chargingStationSchemas = {
  ChargingStation: ChargingStationSchema,
  ChargingStationCreate: ChargingStationCreateSchema,
  ChargingStationOCPI: ChargingStationOCPISchema,
};
