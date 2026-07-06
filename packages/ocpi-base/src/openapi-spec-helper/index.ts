// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import * as oa from 'openapi3-ts';
import type { RoutingControllersOptions } from 'routing-controllers';
import { MetadataArgsStorage } from 'routing-controllers';

import { getSpec } from './generate.spec.helpers.js';
import { parseRoutes } from './parse.metadata.js';
import { mergeDeep } from './merge.deep.js';

export * from './decorators.js';
export * from './generate.spec.helpers.js';
export * from './parse.metadata.js';

/**
 * Convert routing-controllers metadata into an OpenAPI specification. Similar to {@link defaultClassValidatorJsonSchemaOptions}
 * copying the code into our codebase for the purposes
 * of generating the OpenAPI specification from routing-controllers with class-validator metadata, was the easiest way
 * of achieving $refs being used in the generated spec. Refs help create organization by allowing for clear objects to be
 * defined and reused while the open source implementation was generating flat spec objects.
 * Original source - https://github.com/epiphone/routing-controllers-openapi/blob/master/src/index.ts
 *
 * TODO: Consider creating a fork and submitting changes as enhancements which may require additional work
 *
 * @param storage routing-controllers metadata storage
 * @param routingControllerOptions routing-controllers options
 * @param additionalProperties Additional OpenAPI Spec properties
 */
export function routingControllersToSpec(
  storage: MetadataArgsStorage,
  routingControllerOptions: RoutingControllersOptions = {},
  additionalProperties: Partial<oa.OpenAPIObject> = {},
): oa.OpenAPIObject {
  try {
    const routes = parseRoutes(storage, routingControllerOptions);
    const spec = getSpec(
      routes,
      (additionalProperties.components?.schemas || {}) as {
        [p: string]: oa.SchemaObject;
      },
    );
    return mergeDeep(spec, additionalProperties);
  } catch (error) {
    console.error('routingControllersToSpec', error);
    throw error;
  }
}
