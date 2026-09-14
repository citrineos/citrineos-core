// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { UnknownPropertiesType } from '@lib/utils/unknowns';
import { IsString, MinLength } from 'class-validator';

export class CustomDataType {
  @IsString()
  @MinLength(1)
  vendorId!: string;

  @UnknownPropertiesType
  unknownProperties!: unknown[];
}
