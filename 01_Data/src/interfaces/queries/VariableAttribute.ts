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

import { AttributeEnumType, QuerySchema, SetVariableStatusEnumType } from "@citrineos/base";

export interface VariableAttributeQuerystring {
    stationId: string,
    type?: AttributeEnumType,
    value?: string,
    status?: SetVariableStatusEnumType,
    component_evse_id?: number,
    component_evse_connectorId?: number,
    component_name?: string,
    component_instance?: string,
    variable_name?: string,
    variable_instance?: string,
}

export const VariableAttributeQuerySchema = QuerySchema([
    ["stationId", "string"],
    ["type", "string"],
    ["value", "string"],
    ["status", "string"],
    ["component_evse_id", "number"],
    ["component_evse_connectorId", "number"],
    ["component_name", "string"],
    ["component_instance", "string"],
    ["variable_name", "string"],
    ["variable_instance", "string"]], ["stationId"]);


export interface CreateOrUpdateVariableAttributeQuerystring {
    stationId: string,
    setOnCharger?: boolean // Used to indicate value has already been accepted by the station via means other than ocpp
}

export const CreateOrUpdateVariableAttributeQuerySchema = QuerySchema([
    ["stationId", "string"],
    ["setOnCharger", "boolean"]], ["stationId"]);