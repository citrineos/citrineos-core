// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { BaseSchema } from './types/base.dto.js';

export const SignatureAlgorithmSchema = z.enum(['SHA256withRSA', 'SHA256withECDSA']);
export const CountryNameSchema = z.enum(['US']);

export type SignatureAlgorithm = z.infer<typeof SignatureAlgorithmSchema>;
export type CountryName = z.infer<typeof CountryNameSchema>;

export const CertificateSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  serialNumber: z.number().int(), // BIGINT in DB
  issuerName: z.string(),
  organizationName: z.string(),
  commonName: z.string(),
  keyLength: z.number().int().nullable().optional(),
  validBefore: z.iso.datetime().nullable().optional(),
  signatureAlgorithm: SignatureAlgorithmSchema.nullable().optional(),
  countryName: CountryNameSchema.nullable().optional(),
  isCA: z.boolean().optional(),
  pathLen: z.number().int().nullable().optional(),
  certificateFileId: z.string().nullable().optional(),
  privateKeyFileId: z.string().nullable().optional(),
  signedBy: z.string().nullable().optional(),
});

export const CertificateProps = CertificateSchema.keyof().enum;

export type CertificateDto = z.infer<typeof CertificateSchema>;

export const CertificateCreateSchema = CertificateSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type CertificateCreate = z.infer<typeof CertificateCreateSchema>;

export const certificateSchemas = {
  Certificate: CertificateSchema,
  CertificateCreate: CertificateCreateSchema,
};
