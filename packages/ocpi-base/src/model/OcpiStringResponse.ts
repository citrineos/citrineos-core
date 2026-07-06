// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiResponseSchema } from './OcpiResponse.js';

export const OcpiStringResponseSchema = OcpiResponseSchema(z.string());

export type OcpiStringResponse = z.infer<typeof OcpiStringResponseSchema>;
