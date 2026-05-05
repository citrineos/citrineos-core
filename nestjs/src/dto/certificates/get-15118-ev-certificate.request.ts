// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class Get15118EVCertificateRequest {
  @IsString()
  iso15118SchemaVersion: string;

  @IsString()
  action: string;

  @IsString()
  exiRequest: string;

  @IsOptional()
  @IsNumber()
  maximumContractCertificateChains?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prioritizedEMAIDs?: string[];
}
