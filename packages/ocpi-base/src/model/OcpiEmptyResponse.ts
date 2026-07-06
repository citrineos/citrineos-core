// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiResponseStatusCode } from './OcpiResponse.js';

export const OcpiEmptyResponseSchema = z.object({
  status_code: z
    .nativeEnum(OcpiResponseStatusCode)
    .default(OcpiResponseStatusCode.GenericSuccessCode),
  status_message: z.string().optional(),
  timestamp: z.coerce.date(),
  data: z.undefined().optional(),
});
export const OcpiEmptyResponseSchemaName = 'OcpiEmptyResponse';

export type OcpiEmptyResponse = z.infer<typeof OcpiEmptyResponseSchema>;

export const buildOcpiEmptyResponse = (status_code: OcpiResponseStatusCode): OcpiEmptyResponse => {
  return {
    status_code,
    timestamp: new Date(),
  };
};
