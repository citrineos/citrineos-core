// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { EVSEType } from '@dto/shared/evse.dto';

/**
 * OCPP `Component` reference — names a logical component of the
 * charging station's device model (e.g. `OCPPCommCtrlr`, `EVSE`,
 * `Connector`). Always paired with a `VariableType` to point at one
 * specific monitored / configurable field.
 *
 * @example
 * { "name": "OCPPCommCtrlr" }
 */
export class ComponentType {
  /**
   * Standard OCPP component name. See the OCPP 2.0.1 device-model spec.
   * @example 'OCPPCommCtrlr'
   */
  @IsString()
  name: string;

  /**
   * Optional instance discriminator when multiple components share a name.
   * @example 'PrimaryCommunication'
   */
  @IsOptional()
  @IsString()
  instance?: string;

  /**
   * Optional EVSE/connector scope when the component lives under an EVSE.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => EVSEType)
  evse?: EVSEType;
}
