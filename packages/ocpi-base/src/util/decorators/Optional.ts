// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional } from 'class-validator';

export const OPTIONAL_PARAM = 'isOptional';

/**
 * Optional - mimics @IsOptional decorator but adds custom metadata so that it is easily available in
 * Reflect to check if the property is optional and appropriately handle anyOf with $refs when generating OpenApi spec
 */
export const Optional = (isOptional = true) =>
  function (object: NonNullable<unknown>, propertyName: string) {
    if (isOptional) {
      // Apply the standard @IsOptional() decorator
      IsOptional()(object, propertyName);
    }

    // Add custom metadata for additional use cases
    Reflect.defineMetadata(OPTIONAL_PARAM, isOptional, object, propertyName);
  };
