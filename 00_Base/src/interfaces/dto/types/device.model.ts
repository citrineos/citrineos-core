// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OCPP2_0_1 } from '../../../index.js';

export const AttributeEnumSchema = z.enum(OCPP2_0_1.AttributeEnumType);
export const DataEnumSchema = z.enum(OCPP2_0_1.DataEnumType);
export const MutabilityEnumSchema = z.enum(OCPP2_0_1.MutabilityEnumType);
