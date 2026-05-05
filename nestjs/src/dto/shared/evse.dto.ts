// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional } from 'class-validator';

/**
 * OCPP `EVSE` reference — identifies a specific EVSE on a charging
 * station, optionally pinning a connector within that EVSE. Wire-level
 * `id` is 1-based per OCPP semantics.
 *
 * @example
 * { "id": 1, "connectorId": 1 }
 */
export class EVSEType {
  /**
   * EVSE id at the station. Must be ≥ 1.
   * @example 1
   */
  @IsNumber()
  id: number;

  /**
   * Optional connector id within the EVSE. Omit to refer to the whole EVSE.
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  connectorId?: number;
}
