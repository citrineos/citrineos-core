/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

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

export enum HttpMethod {
    Get = 'GET',
    Put = 'PUT',
    Post = 'POST',
    Patch = 'PATCH',
    Delete = 'DELETE'
}

export const METADATA_MESSAGE_ENDPOINTS = 'METADATA_MESSAGE_ENDPOINTS';
export const METADATA_DATA_ENDPOINTS = 'METADATA_DATA_ENDPOINTS';

export { AbstractModuleApi } from "./AbstractModuleApi";
export { AsDataEndpoint } from "./AsDataEndpoint";
export { AsMessageEndpoint } from "./AsMessageEndpoint";
export { IDataEndpointDefinition } from "./DataEndpointDefinition";
export { IMessageEndpointDefinition } from "./MessageEndpointDefinition";
export { IMessageQuerystring } from "./MessageQuerystring";
export { IModuleApi } from "./ModuleApi";