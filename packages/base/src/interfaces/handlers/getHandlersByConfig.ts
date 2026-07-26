// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { CallAction } from '@ocpp/rpc/message.js';
import type { AbstractHandler } from '@interfaces/handlers/AbstractHandler.js';
import {
  AS_HANDLER_CLASS_METADATA,
  HANDLER_CLASS_REGISTRY,
} from '@interfaces/handlers/AsHandlerClass.js';
import type { IHandlerClassDefinition } from '@interfaces/handlers/HandlerClassDefinition.js';
import { MessageState } from '@interfaces/messages/index.js';

/** Derives a handler's DI token from its class name, e.g. `GetCertificateStatusRequestHandler` -> `GetCertificateStatusRequestHandler`. */
function tokenFor(ctor: new (...args: any[]) => AbstractHandler): string {
  return ctor.name.charAt(0).toLowerCase() + ctor.name.slice(1);
}

/**
 * Resolves every {@link AsHandlerClass}-decorated handler whose configured action is present
 * in `requests`/`responses`, off the container cradle. A module's config is the only thing
 * that decides which handlers it wires up — there's no separate per-module handler list to
 * keep in sync with config, since the actions a handler serves are already declared once, on
 * the handler class itself via {@link AsHandlerClass}.
 *
 * Relies on every handler class having already been imported somewhere (as the app's
 * composition root must do anyway, to register each one for DI) so its decorator has run and
 * registered it in {@link HANDLER_CLASS_REGISTRY}, and on each handler being registered in the
 * container under its class name (PascalCase).
 */
export function getHandlersByConfig(
  cradle: Record<string, unknown>,
  requests: CallAction[],
  responses: CallAction[],
): AbstractHandler[] {
  return HANDLER_CLASS_REGISTRY.filter((ctor) => {
    const definitions = (Reflect.getMetadata(AS_HANDLER_CLASS_METADATA, ctor) ??
      []) as IHandlerClassDefinition[];
    return definitions.some((definition) =>
      definition.type === MessageState.Request
        ? requests.includes(definition.action)
        : responses.includes(definition.action),
    );
  })
    .map((ctor) => {
      const token = tokenFor(ctor);
      const handler = cradle[token] as AbstractHandler | undefined;
      if (!handler) {
        console.warn(
          `No DI registration found for handler token "${token}" (class ${ctor.name}). ` +
            `Register it in the app container under that exact camelCase token.`,
        );
        return null;
      }
      return handler;
    })
    .filter((handler) => !!handler);
}
