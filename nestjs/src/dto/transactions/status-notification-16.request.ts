// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional, IsString } from 'class-validator';

/** OCPP 1.6 StatusNotification request shape (different from 2.0.1). */

export class StatusNotification16Request {
  @IsNumber()
  connectorId: number;

  @IsString()
  status: string;

  @IsString()
  errorCode: string;

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  info?: string;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  vendorErrorCode?: string;
}
