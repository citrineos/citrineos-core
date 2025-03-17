// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IMessageEndpointDefinition, METADATA_MESSAGE_ENDPOINTS } from '.';
import { CallAction } from '../../ocpp/rpc/message';

/**
 * Decorator for use in module API class to expose methods as REST OCPP message endpoints.
 *
 * @param {CallAction} action - The call action.
 * @param {object} bodySchema - The body schema.
 * @param {Record<string, any>} optionalQuerystrings - The optional querystrings.
 * @return {void} This function does not return anything.
 */
export const AsMessageEndpoint = function (
  action: CallAction,
  bodySchema: object,
  optionalQuerystrings?: Record<string, any>,
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): void => {
    if (!Reflect.hasMetadata(METADATA_MESSAGE_ENDPOINTS, target.constructor)) {
      Reflect.defineMetadata(
        METADATA_MESSAGE_ENDPOINTS,
        new Array<IMessageEndpointDefinition>(),
        target.constructor,
      );
    }
    const messageEndpoints = Reflect.getMetadata(
      METADATA_MESSAGE_ENDPOINTS,
      target.constructor,
    ) as Array<IMessageEndpointDefinition>;
    messageEndpoints.push({
      action: action,
      method: descriptor.value,
      methodName: propertyKey,
      bodySchema: bodySchema,
      optionalQuerystrings: optionalQuerystrings,
    });
    Reflect.defineMetadata(METADATA_MESSAGE_ENDPOINTS, messageEndpoints, target.constructor);
  };
};
