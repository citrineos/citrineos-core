// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum } from 'class-validator';

/**
 * Extends @IsEnum decorator to add custom metadata so that it is easily available in additionalConverters and is
 * easily available to convert Swagger UI schema route params to have $refs appropriately
 */
export const Enum = (enumType: any, enumName: string) =>
  function (object: NonNullable<unknown>, propertyName: string) {
    // Apply the standard @IsOptional() decorator
    IsEnum(enumType)(object, propertyName);

    // Add custom metadata for additional use cases
    Reflect.defineMetadata('isEnum', enumName, object, propertyName);
  };
