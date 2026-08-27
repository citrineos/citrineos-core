// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type CallAction, OCPPVersion } from '@citrineos/types';
import type { IHandlerMetadata } from '@interfaces/handlers/HandlerMetadata.js';
import type { AbstractHandler } from '@interfaces/handlers/AbstractHandler.js';
import { MessageState } from '@interfaces/messages/index.js';

export const AS_HANDLER_CLASS_METADATA = 'AS_HANDLER_CLASS_METADATA';

//Sets up main decorator flow
const asHandlerClass = function (protocols: OCPPVersion[], action: CallAction, type: MessageState) {
  return <T extends new (...args: never[]) => AbstractHandler>(target: T): T => {
    if (!Reflect.hasMetadata(AS_HANDLER_CLASS_METADATA, target)) {
      Reflect.defineMetadata(AS_HANDLER_CLASS_METADATA, [], target);
    }
    const handlers = Reflect.getMetadata(
      AS_HANDLER_CLASS_METADATA,
      target,
    ) as Array<IHandlerMetadata>;
    protocols.forEach((protocol) => {
      handlers.push({ action, protocol, type });
    });
    Reflect.defineMetadata(AS_HANDLER_CLASS_METADATA, handlers, target);

    return target;
  };
};

/** Decorates a handler class that handles a Call (request) for the given actions/protocols. */
export const AsRequestHandler = (protocols: OCPPVersion[], action: CallAction) =>
  asHandlerClass(protocols, action, MessageState.Request);

/** Decorates a handler class that handles a CallResult (response) for the given actions/protocols. */
export const AsResponseHandler = (protocols: OCPPVersion[], action: CallAction) =>
  asHandlerClass(protocols, action, MessageState.Response);
