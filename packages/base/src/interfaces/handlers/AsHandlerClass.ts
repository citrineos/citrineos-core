// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type CallAction, OCPPVersion } from '@ocpp/rpc/message.js';
import type { IHandlerClassDefinition } from '@interfaces/handlers/HandlerClassDefinition.js';
import type { AbstractHandler } from '@interfaces/handlers/AbstractHandler.js';
import { MessageState } from '@interfaces/messages/index.js';

export const AS_HANDLER_CLASS_METADATA = 'AS_HANDLER_CLASS_METADATA';

/**
 * Every class decorated with {@link AsHandlerClass}, in decoration order. Populated as a
 * side effect of importing the handler's module (the same import every composition root
 * already needs to do to register the class for DI), so config-driven handler resolution
 * (see {@link getHandlersByConfig}) can discover the full set of known handlers without a
 * hand-maintained list.
 */
export const HANDLER_CLASS_REGISTRY: Array<new (...args: any[]) => AbstractHandler> = [];

export const AsHandlerClass = function (
  protocols: OCPPVersion[],
  action: CallAction,
  type: MessageState,
) {
  return (target: new (...args: any[]) => AbstractHandler) => {
    if (!Reflect.hasMetadata(AS_HANDLER_CLASS_METADATA, target)) {
      Reflect.defineMetadata(AS_HANDLER_CLASS_METADATA, [], target);
    }
    const handlers = Reflect.getMetadata(
      AS_HANDLER_CLASS_METADATA,
      target,
    ) as Array<IHandlerClassDefinition>;
    protocols.forEach((protocol) => {
      handlers.push({ action, protocol, type });
    });
    Reflect.defineMetadata(AS_HANDLER_CLASS_METADATA, handlers, target);

    if (!HANDLER_CLASS_REGISTRY.includes(target)) {
      HANDLER_CLASS_REGISTRY.push(target);
    }

    return target;
  };
};
