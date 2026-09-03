// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base-dto.js';
import { CertificateUseEnumSchema, InstallCertificateStatusEnumSchema } from './types/enums.js';

export const InstallCertificateAttemptSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.number().int().nullable().optional(),
  ocppConnectionName: z.string().max(36),
  certificateType: CertificateUseEnumSchema,
  certificateId: z.number().int().nullable().optional(),
  requestId: z.number().int().nullable().optional(),
  status: InstallCertificateStatusEnumSchema.nullable().optional(),
});

export const InstallCertificateAttemptProps = InstallCertificateAttemptSchema.keyof().enum;

export type InstallCertificateAttemptDto = z.infer<typeof InstallCertificateAttemptSchema>;

export const InstallCertificateAttemptCreateSchema = InstallCertificateAttemptSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type InstallCertificateAttemptCreate = z.infer<typeof InstallCertificateAttemptCreateSchema>;

export const installCertificateAttemptSchemas = {
  InstallCertificateAttempt: InstallCertificateAttemptSchema,
  InstallCertificateAttemptCreate: InstallCertificateAttemptCreateSchema,
};
