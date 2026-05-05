// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsString } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 UnpublishFirmware request — stops a charger from
 * hosting a previously published firmware bundle.
 */
export class UnpublishFirmwareRequest {
  @IsString()
  checksum: string;
}
