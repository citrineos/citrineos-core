// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Param } from 'routing-controllers';
import { SchemaStore } from '../../openapi-spec-helper/schema.store.js';

export const ENUM_PARAM = 'EnumParam';

/**
 * Extends @Params decorator to add custom metadata so that it is easily available to convert Swagger UI schema route
 * params to have $refs appropriately
 * @constructor
 * @param clazz
 * @param options
 */
export const EnumParam = (name: string, enumType: any, enumName: string) =>
  function (object: NonNullable<unknown>, methodName: string, index: number) {
    // Apply the standard @Params() decorator
    Param(name)(object, methodName, index);

    // Register the enum as a component schema so the $ref produced for this path
    // param resolves and Swagger UI renders a dropdown of the allowed values.
    if (enumName && !SchemaStore.getSchema(enumName)) {
      SchemaStore.addSchema(enumName, {
        type: 'string',
        enum: Object.values(enumType),
      });
    }

    // Add custom metadata for additional use cases
    Reflect.defineMetadata(ENUM_PARAM, enumName, object, `${methodName}.${name}`);
  };
