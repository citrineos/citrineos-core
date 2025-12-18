// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ChargingStationSchema } from './charging.station.dto.js';
import { ComponentSchema } from './component.dto.js';
import { EvseTypeSchema } from './evse.type.dto.js';
import { BaseSchema } from './types/base.dto.js';
import { AttributeEnumSchema, DataEnumSchema, MutabilityEnumSchema } from './types/device.model.js';
import { VariableSchema } from './variable.dto.js';

export const VariableAttributeSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string(),
  chargingStation: ChargingStationSchema,
  type: AttributeEnumSchema.nullable().optional(),
  dataType: DataEnumSchema,
  value: z.string().max(4000).nullable().optional(),
  mutability: MutabilityEnumSchema.nullable().optional(),
  persistent: z.boolean().default(false).nullable().optional(),
  constant: z.boolean().default(false).nullable().optional(),
  generatedAt: z.iso.datetime(),
  variable: VariableSchema,
  variableId: z.number().int().nullable().optional(),
  component: ComponentSchema,
  componentId: z.number().int().nullable().optional(),
  evse: EvseTypeSchema.optional(),
  evseDatabaseId: z.number().int().nullable().optional(),
  bootConfigId: z.string().nullable().optional(),
});

export const VariableAttributeProps = VariableAttributeSchema.keyof().enum;

export type VariableAttributeDto = z.infer<typeof VariableAttributeSchema>;

export const VariableAttributeCreateSchema = VariableAttributeSchema.omit({
  id: true,
  tenant: true,
  chargingStation: true,
  variable: true,
  component: true,
  evse: true,
  statuses: true,
  bootConfig: true,
  updatedAt: true,
  createdAt: true,
});

export type VariableAttributeCreate = z.infer<typeof VariableAttributeCreateSchema>;

export const variableAttributeSchemas = {
  VariableAttribute: VariableAttributeSchema,
  VariableAttributeCreate: VariableAttributeCreateSchema,
};
