// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';
import { DeleteCertificateStatusEnumSchema, HashAlgorithmEnumSchema } from './types/enums.js';

export const DeleteCertificateAttemptSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.number().int().nullable().optional(),
  ocppConnectionName: z.string().max(36),
  hashAlgorithm: HashAlgorithmEnumSchema,
  issuerNameHash: z.string().nullable().optional(),
  issuerKeyHash: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  status: DeleteCertificateStatusEnumSchema.nullable().optional(),
});

export const DeleteCertificateAttemptProps = DeleteCertificateAttemptSchema.keyof().enum;

export type DeleteCertificateAttemptDto = z.infer<typeof DeleteCertificateAttemptSchema>;

export const DeleteCertificateAttemptCreateSchema = DeleteCertificateAttemptSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type DeleteCertificateAttemptCreate = z.infer<typeof DeleteCertificateAttemptCreateSchema>;

export const deleteCertificateAttemptSchemas = {
  DeleteCertificateAttempt: DeleteCertificateAttemptSchema,
  DeleteCertificateAttemptCreate: DeleteCertificateAttemptCreateSchema,
};
