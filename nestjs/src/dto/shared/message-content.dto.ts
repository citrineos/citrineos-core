// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 `MessageContentType`. The `format` field carries the
 * MessageFormatEnum (ASCII / HTML / URI / UTF8); kept as a string here
 * rather than a dedicated enum since the wire shape allows future formats
 * and the JSON schema is the source of truth for accepted values.
 */
export class MessageContentType {
  @IsString()
  format: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  language?: string;
}
