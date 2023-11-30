/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

export { Namespace } from "./namespace";
export { default as AuthorizationDataSchema } from './schemas/AuthorizationDataSchema.json';
export { default as BootConfigSchema } from './schemas/BootConfigSchema.json';
export { default as ChargingStationTypeSchema } from './schemas/ChargingStationTypeSchema.json';
export { default as ReportDataTypeSchema } from './schemas/ReportDataTypeSchema.json';
export { default as SetVariableResultTypeSchema } from './schemas/SetVariableResultTypeSchema.json';

export function QuerySchema(properties: [string, string][], required?: string[]): object {
    const schema: Record<string, string | object> = {
        "type": "object",
        "properties": {}
    };
    properties.forEach((property: [string, string]) => {
        (schema["properties"] as Record<string, string | object>)[property[0]] = {
            "type": property[1]
        };
    });
    if (required) {
        schema["required"] = required;
    }
    return schema;
}