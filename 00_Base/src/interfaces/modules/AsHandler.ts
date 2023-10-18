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

import { CallAction } from "../../ocpp/rpc/message";
import { IHandlerDefinition } from "./HandlerDefinition";

/**
 * Decorators for module components.
 */

export const AS_HANDLER_METADATA = 'AS_HANDLER_METADATA';

/**
 * Decorator function for OCPP modules to expose methods within module classes as handlers for given call action.
 *
 * @param {CallAction} action - the call action parameter
 * @return {PropertyDescriptor} - the property descriptor
 */
export const AsHandler = function (action: CallAction) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
        if (!Reflect.hasMetadata(AS_HANDLER_METADATA, target.constructor)) {
            Reflect.defineMetadata(AS_HANDLER_METADATA, [], target.constructor);
        }
        const handlers = Reflect.getMetadata(AS_HANDLER_METADATA, target.constructor) as Array<IHandlerDefinition>;
        handlers.push({ action: action, methodName: propertyKey, method: descriptor.value });
        Reflect.defineMetadata(AS_HANDLER_METADATA, handlers, target.constructor);
        return descriptor;
    };
};