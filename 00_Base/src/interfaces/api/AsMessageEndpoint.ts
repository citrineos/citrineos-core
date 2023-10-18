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

import { IMessageEndpointDefinition, METADATA_MESSAGE_ENDPOINTS } from ".";
import { CallAction } from "../../ocpp/rpc/message";

/**
 * Decorator for use in module API class to expose methods as REST OCPP message endpoints.
 *
 * @param {CallAction} action - The call action.
 * @param {object} bodySchema - The body schema.
 * @return {void} This function does not return anything.
 */
export const AsMessageEndpoint = function (action: CallAction, bodySchema: object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor): void => {
        if (!Reflect.hasMetadata(METADATA_MESSAGE_ENDPOINTS, target.constructor)) {
            Reflect.defineMetadata(METADATA_MESSAGE_ENDPOINTS, new Array<IMessageEndpointDefinition>(), target.constructor);
        }
        const messageEndpoints = Reflect.getMetadata(METADATA_MESSAGE_ENDPOINTS, target.constructor) as Array<IMessageEndpointDefinition>;
        messageEndpoints.push({
            action: action,
            method: descriptor.value,
            methodName: propertyKey,
            bodySchema: bodySchema
        });
        Reflect.defineMetadata(METADATA_MESSAGE_ENDPOINTS, messageEndpoints, target.constructor);
    };
};