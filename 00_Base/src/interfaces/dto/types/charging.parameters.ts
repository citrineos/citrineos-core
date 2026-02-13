// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const ACChargingParametersSchema = z.object({
  energyAmount: z.number(),
  evMinCurrent: z.number(),
  evMaxCurrent: z.number(),
  evMaxVoltage: z.number(),
});

export type ACChargingParametersType = z.infer<typeof ACChargingParametersSchema>;

export const DCChargingParametersSchema = z.object({
  evMaxCurrent: z.number(),
  evMaxVoltage: z.number(),
  energyAmount: z.number().nullable().optional(),
  evMaxPower: z.number().nullable().optional(),
  stateOfCharge: z.number().nullable().optional(),
  evEnergyCapacity: z.number().nullable().optional(),
  fullSoC: z.number().nullable().optional(),
  bulkSoC: z.number().nullable().optional(),
});

export type DCChargingParametersType = z.infer<typeof DCChargingParametersSchema>;
