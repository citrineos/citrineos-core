// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export { Namespace } from './namespace';
export { default as AuthorizationDataSchema } from './schemas/AuthorizationDataSchema.json';
export { default as BootConfigSchema } from './schemas/BootConfigSchema.json';
export { default as ChargingStationTypeSchema } from './schemas/ChargingStationTypeSchema.json';
export { default as ReportDataTypeSchema } from './schemas/ReportDataTypeSchema.json';
export { default as SetVariableResultTypeSchema } from './schemas/SetVariableResultTypeSchema.json';
export { default as UpdateChargingStationPasswordSchema } from './schemas/UpdateChargingStationPasswordRequestSchema.json';

/**
 * Utility function for creating querystring schemas for fastify route definitions
 * @param properties An array of key-type pairs. Types ending in '[]' will be treated as arrays of that type.
 * @param required An array of required keys.
 * @returns
 */
export function QuerySchema(
  name: string,
  properties: [string, string][],
  required?: string[],
): object {
  const schema: Record<string, string | object> = {
    $id: name,
    type: 'object',
    properties: {},
  };
  properties.forEach((property: [string, string]) => {
    const [key, type] = property;

    // '[]' denotes an array
    if (type.endsWith('[]')) {
      (schema['properties'] as Record<string, object>)[key] = {
        type: 'array',
        items: { type: type.slice(0, -2) }, // Remove '[]' to get the base type
      };
    } else {
      // non-array types
      (schema['properties'] as Record<string, string | object>)[key] = {
        type,
      };
    }
  });
  if (required) {
    schema['required'] = required;
  }
  return schema;
}

export const MessageConfirmationSchema = QuerySchema(
  'MessageConfirmationSchema',
  [
    ['success', 'boolean'],
    ['payload', 'string'],
  ],
  ['success'],
);
