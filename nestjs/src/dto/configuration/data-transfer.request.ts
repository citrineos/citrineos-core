// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 DataTransfer request — vendor-specific bidirectional
 * extension channel. Mirrors the existing charger-side request shape
 * under `messages/provisioning/data-transfer.request.ts` (the message
 * is symmetric: either side can originate it).
 */
export class CsmsDataTransferRequest {
  @IsString()
  vendorId: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  /** Vendor payload — any shape. */
  @IsOptional()
  data?: unknown;
}
