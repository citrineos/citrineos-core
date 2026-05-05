// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsString } from 'class-validator';

/** OCPP 1.6 Authorize request. */

export class Authorize16Request {
  @IsString()
  idTag: string;
}
