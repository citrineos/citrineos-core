// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { DtoEventObjectType, DtoEventType } from './types.js';

/**
 * Handler definition for Dto subscriptions
 */
export interface IDtoEventHandlerDefinition {
  eventType: DtoEventType;
  objectType: DtoEventObjectType;
  eventId: string;
  method: Function;
  methodName: string;
}

/**
 * Metadata key for Dto handlers
 */
export const AS_DTO_EVENT_HANDLER_METADATA = 'AS_DTO_EVENT_HANDLER_METADATA';

/**
 * Decorator function for Dto modules to expose methods within module classes
 * as handlers for given event type and object type combinations.
 *
 * @param {DtoEventType} eventType - the Dto event type (INSERT, UPDATE, DELETE)
 * @param {DtoEventObjectType} objectType - the Dto object type (CDR, LOCATION, etc.)
 * @param {string} eventId - the unique identifier for the event
 * @return {PropertyDescriptor} - the property descriptor
 */
export const AsDtoEventHandler = function (
  eventType: DtoEventType,
  objectType: DtoEventObjectType,
  eventId: string,
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    if (!Reflect.hasMetadata(AS_DTO_EVENT_HANDLER_METADATA, target.constructor)) {
      Reflect.defineMetadata(AS_DTO_EVENT_HANDLER_METADATA, [], target.constructor);
    }
    const handlers = Reflect.getMetadata(
      AS_DTO_EVENT_HANDLER_METADATA,
      target.constructor,
    ) as Array<IDtoEventHandlerDefinition>;
    handlers.push({
      eventType: eventType,
      objectType: objectType,
      eventId: eventId,
      methodName: propertyKey,
      method: descriptor.value,
    });
    Reflect.defineMetadata(AS_DTO_EVENT_HANDLER_METADATA, handlers, target.constructor);
    return descriptor;
  };
};

export const getDtoEventHandlerMetaData = (target: any): IDtoEventHandlerDefinition[] => {
  const metadata = Reflect.getMetadata(AS_DTO_EVENT_HANDLER_METADATA, target.constructor);
  if (!metadata) {
    return [];
  }
  return metadata as IDtoEventHandlerDefinition[];
};
