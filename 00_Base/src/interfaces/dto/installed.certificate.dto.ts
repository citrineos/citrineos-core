// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const InstalledCertificateSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  stationId: z.string().max(36),
  hashAlgorithm: z.string(),
  issuerNameHash: z.string(),
  issuerKeyHash: z.string(),
  serialNumber: z.string(),
  certificateType: z.string(),
});

export const InstalledCertificateProps = InstalledCertificateSchema.keyof().enum;

export type InstalledCertificateDto = z.infer<typeof InstalledCertificateSchema>;

export const InstalledCertificateCreateSchema = InstalledCertificateSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type InstalledCertificateCreate = z.infer<typeof InstalledCertificateCreateSchema>;

export const installedCertificateSchemas = {
  InstalledCertificate: InstalledCertificateSchema,
  InstalledCertificateCreate: InstalledCertificateCreateSchema,
};
