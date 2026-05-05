// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber } from 'class-validator';

/**
 * OCPP 1.6 UnlockConnector request. 1.6 has no EVSE concept — only a
 * top-level `connectorId`.
 */
export class UnlockConnector16Request {
  @IsNumber()
  connectorId: number;
}
