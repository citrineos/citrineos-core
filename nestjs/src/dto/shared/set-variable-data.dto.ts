// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttributeEnumType } from '@enums/attribute.enum';
import { ComponentType } from '@dto/shared/component.dto';
import { VariableType } from '@dto/shared/variable.dto';

/** Single entry in a SetVariables request. */

export class SetVariableDataType {
  @IsOptional()
  @IsEnum(AttributeEnumType)
  attributeType?: AttributeEnumType;

  @IsString()
  attributeValue: string;

  @ValidateNested()
  @Type(() => ComponentType)
  component: ComponentType;

  @ValidateNested()
  @Type(() => VariableType)
  variable: VariableType;
}
