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

import { METADATA_ADMIN_ENDPOINTS } from ".";
import { HttpMethod } from "../api";
import { EventGroup } from "../messages";
import { IAdminEndpointDefinition } from "./AdminEndpointDefinition";

/**
 * Decorator for use in module API class to expose methods as REST data endpoints.
 * 
 * @param {Namespace} namespace - The namespace value.
 * @param {HttpMethod} method - The HTTP method value.
 * @param {object} querySchema - The query schema value (optional).
 * @param {object} bodySchema - The body schema value (optional).
 * @return {void} - No return value.
 */
export const AsAdminEndpoint = function (eventGroup: EventGroup, method: HttpMethod, querySchema?: object, bodySchema?: object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor): void => {
        if (!Reflect.hasMetadata(METADATA_ADMIN_ENDPOINTS, target.constructor)) {
            Reflect.defineMetadata(METADATA_ADMIN_ENDPOINTS, [], target.constructor);
        }
        const adminEndpoints = Reflect.getMetadata(METADATA_ADMIN_ENDPOINTS, target.constructor) as Array<IAdminEndpointDefinition>;
        adminEndpoints.push({
            method: descriptor.value,
            methodName: propertyKey,
            eventGroup: eventGroup,
            httpMethod: method,
            querySchema: querySchema,
            bodySchema: bodySchema
        });
        Reflect.defineMetadata(METADATA_ADMIN_ENDPOINTS, adminEndpoints, target.constructor);
    };
};