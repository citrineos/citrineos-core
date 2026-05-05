// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/**
 * OCPP `Variable` reference — names a single field on a
 * `ComponentType`. Composed into `SetVariables`, `GetVariables`,
 * `NotifyEvent`, and `NotifyMonitoringReport` payloads.
 *
 * @example
 * { "name": "HeartbeatInterval" }
 */
export class VariableType {
  /**
   * Standard OCPP variable name. See the OCPP 2.0.1 device-model spec.
   * @example 'HeartbeatInterval'
   */
  @IsString()
  name: string;

  /**
   * Optional instance discriminator when multiple variables share a name.
   * @example 'Mqtt'
   */
  @IsOptional()
  @IsString()
  instance?: string;
}
