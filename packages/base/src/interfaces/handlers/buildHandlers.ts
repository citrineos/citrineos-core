// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AbstractHandler } from '@interfaces/handlers/AbstractHandler.js';

/**
 * A handler class as passed to {@link buildHandlers}
 */
export type HandlerClass = new (...args: never[]) => AbstractHandler;

/**
 * The subset of an Awilix container {@link buildHandlers} needs
 */
export interface IHandlerBuilder {
  build<T>(target: new (...args: never[]) => T): T;
}

/**
 * The module's handler scope
 */
export interface HandlerResolverCradle {
  moduleScope: IHandlerBuilder;
}

/**
 * Builds every handler class a module declares, using `builder` so their dependencies resolve from
 * that module's own container scope.
 *
 * The resulting set is what the module can handle, and therefore what it subscribes to — see
 * `AbstractModule`, which derives its requests and responses from these handlers' declared actions.
 * Config no longer selects handlers; it can only exclude actions from the subscription.
 */
export function buildHandlers(
  builder: IHandlerBuilder,
  handlerClasses: ReadonlyArray<HandlerClass>,
): AbstractHandler[] {
  return handlerClasses.map((handlerClass) => builder.build(handlerClass));
}
