// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsOptional } from 'class-validator';

export class MessageConfirmation {
  @IsBoolean()
  success!: boolean;

  @IsOptional()
  payload?: string | object;
}
