// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const OCPIVersionNumberSchema = z.enum(['2.2.1']);

export const ImageSchema = z.object({
  url: z.string(),
  type: z.string(),
  category: z.string(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

export const BusinessDetailsSchema = z.object({
  name: z.string(),
  website: z.string().optional(),
  logo: ImageSchema.optional(),
});

export const CredentialRoleSchema = z.object({
  role: z.enum(['CPO', 'EMSP', 'HUB', 'NAP', 'NSP', 'SCSP']),
  businessDetails: BusinessDetailsSchema,
});

export const VersionSchema = z.object({
  version: OCPIVersionNumberSchema,
  versionDetailsUrl: z.string().optional(),
});

export const EndpointSchema = z.object({
  identifier: z.string(),
  url: z.string(),
});

export const CredentialsSchema = z.object({
  versionsUrl: z.string(),
  token: z.string().optional(),
  certificateRef: z.string().optional(),
});

export const ServerProfileSchema = z.object({
  credentialsRole: CredentialRoleSchema,
  versionDetails: z.array(VersionSchema),
  versionEndpoints: z.record(z.string(), z.array(EndpointSchema)),
});

export const PartnerProfileSchema = z.object({
  version: VersionSchema,
  serverCredentials: CredentialsSchema,
  roles: z.array(CredentialRoleSchema).optional(),
  credentials: CredentialsSchema.optional(),
  endpoints: z.array(EndpointSchema).optional(),
});

export type OCPIVersionNumber = z.infer<typeof OCPIVersionNumberSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type BusinessDetails = z.infer<typeof BusinessDetailsSchema>;
export type CredentialRole = z.infer<typeof CredentialRoleSchema>;
export type Version = z.infer<typeof VersionSchema>;
export type Endpoint = z.infer<typeof EndpointSchema>;
export type Credentials = z.infer<typeof CredentialsSchema>;
export type ServerProfile = z.infer<typeof ServerProfileSchema>;
export type PartnerProfile = z.infer<typeof PartnerProfileSchema>;
