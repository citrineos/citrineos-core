// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsDateString, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class Hubclientinfo {
  @MaxLength(3)
  @IsString()
  @IsNotEmpty()
  party_id!: string;

  @MaxLength(2)
  @MinLength(2)
  @IsString()
  @IsNotEmpty()
  country_code!: string;

  @IsString()
  @IsNotEmpty()
  role!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}
