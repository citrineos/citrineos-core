// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { RoutingControllersOptions } from 'routing-controllers';
import { MetadataArgsStorage } from 'routing-controllers';
import type { ActionMetadataArgs } from 'routing-controllers/types/metadata/args/ActionMetadataArgs.js';
import type { ControllerMetadataArgs } from 'routing-controllers/types/metadata/args/ControllerMetadataArgs.js';
import type { ParamMetadataArgs } from 'routing-controllers/types/metadata/args/ParamMetadataArgs.js';
import type { ResponseHandlerMetadataArgs } from 'routing-controllers/types/metadata/args/ResponseHandleMetadataArgs.js';

/**
 * All the context for a single route.
 */
export interface IRoute {
  readonly action: ActionMetadataArgs;
  readonly controller: ControllerMetadataArgs;
  readonly options: RoutingControllersOptions;
  readonly params: ParamMetadataArgs[];
  readonly responseHandlers: ResponseHandlerMetadataArgs[];
}

/**
 * Parse routing-controllers metadata into an IRoute objects array.
 */
export function parseRoutes(
  storage: MetadataArgsStorage,
  options: RoutingControllersOptions = {},
): IRoute[] {
  return storage.actions.map((action) => ({
    action,
    controller: storage.controllers.find(
      (c) => c.target === action.target,
    ) as ControllerMetadataArgs,
    options,
    params: storage
      .filterParamsWithTargetAndMethod(action.target, action.method)
      .sort((a, b) => a.index - b.index),
    responseHandlers: storage.filterResponseHandlersWithTargetAndMethod(
      action.target,
      action.method,
    ),
  }));
}
