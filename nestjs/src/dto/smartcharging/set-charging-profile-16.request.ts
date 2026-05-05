// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber } from 'class-validator';

/**
 * OCPP 1.6 SetChargingProfile request. `csChargingProfiles` carries the
 * 1.6-flavoured `ChargingProfile` shape (different from 2.0.1's
 * `ChargingProfileType`); accepted opaquely until we hand-port it.
 */
export class SetChargingProfile16Request {
  @IsNumber()
  connectorId: number;

  csChargingProfiles: Record<string, unknown>;
}
