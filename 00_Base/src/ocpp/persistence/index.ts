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
    (schema['properties'] as Record<string, string | object>)[property[0]] = {
      type: property[1],
    };
  });
  if (required) {
    schema['required'] = required;
  }
  return schema;
}
