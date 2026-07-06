// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { VersionNumber } from '../../model/VersionNumber.js';

import { z } from 'zod';

export const OcpiRegistrationParamsSchema = z.object({
  authorization: z.string(),
  xRequestId: z.string().optional(),
  xCorrelationId: z.string().optional(),
  version: z.nativeEnum(VersionNumber).optional().default(VersionNumber.TWO_DOT_TWO_DOT_ONE),
});

export type OcpiRegistrationParams = z.infer<typeof OcpiRegistrationParamsSchema>;

export const buildOcpiRegistrationParams = (
  version: VersionNumber,
  authorization: string,
  xRequestId?: string,
  xCorrelationId?: string,
): OcpiRegistrationParams => ({
  authorization,
  xRequestId,
  xCorrelationId,
  version,
});
