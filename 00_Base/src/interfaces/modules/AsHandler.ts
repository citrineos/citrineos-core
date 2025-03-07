// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CallAction, OCPPVersion } from '../../ocpp/rpc/message';
import { IHandlerDefinition } from './HandlerDefinition';

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
export const AsHandler = function (protocol: OCPPVersion, action: CallAction) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    if (!Reflect.hasMetadata(AS_HANDLER_METADATA, target.constructor)) {
      Reflect.defineMetadata(AS_HANDLER_METADATA, [], target.constructor);
    }
    const handlers = Reflect.getMetadata(
      AS_HANDLER_METADATA,
      target.constructor,
    ) as Array<IHandlerDefinition>;
    handlers.push({
      action: action,
      protocol: protocol,
      methodName: propertyKey,
      method: descriptor.value,
    });
    Reflect.defineMetadata(AS_HANDLER_METADATA, handlers, target.constructor);
    return descriptor;
  };
};
