// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type CallAction, OCPPVersion } from '@ocpp/rpc/message.js';
import type {
  HandlerMessageType,
  IHandlerClassDefinition,
} from '@interfaces/handlers/HandlerClassDefinition.js';
import type { AbstractHandler } from '@interfaces/handlers/AbstractHandler.js';

export const AS_HANDLER_CLASS_METADATA = 'AS_HANDLER_CLASS_METADATA';

export const AsHandlerClass = function (
  protocols: OCPPVersion[],
  action: CallAction,
  type: HandlerMessageType,
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

    return target;
  };
};
