// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 SetNetworkProfile request.
 *
 * `connectionData` is the `NetworkConnectionProfileType` — accepted as
 * an opaque object here because the wire DTO has many vendor-specific
 * extensions and is forwarded verbatim to the charger.
 */
export class SetNetworkProfileRequest {
  @IsNumber()
  configurationSlot: number;

  connectionData: Record<string, unknown>;
}
