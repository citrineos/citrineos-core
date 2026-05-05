// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsObject, IsOptional, IsString } from 'class-validator';

/**
 * OCPP 1.6 DataTransfer request. Vendor-specific channel — the spec
 * leaves the `data` shape to the vendor.
 */
export class DataTransfer16Request {
  @IsString()
  vendorId: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown> | string;
}
