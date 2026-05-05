// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber } from 'class-validator';

/**
 * OCPP 2.1 SetDefaultTariff request — only present in 2.1.
 *
 * `tariff` carries the OCPI-shaped tariff details; we accept it as an
 * opaque object since the structure is large and validated downstream
 * by the charger. Future tightening tracked in the parity roadmap §5.8.
 */
export class SetDefaultTariffRequest {
  @IsNumber()
  evseId: number;

  tariff: Record<string, unknown>;
}
