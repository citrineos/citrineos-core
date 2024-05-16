import * as oa from 'openapi3-ts';
import {MetadataArgsStorage, RoutingControllersOptions,} from 'routing-controllers';

import {getSpec} from './generate.spec';
import {parseRoutes} from './parse.metadata';
import {mergeDeep} from './merge.deep';

export * from './decorators';
export * from './generate.spec';
export * from './parse.metadata';


// todo create fork with changes instead
/**
 * Convert routing-controllers metadata into an OpenAPI specification.
 * Original source - https://github.com/epiphone/routing-controllers-openapi/blob/master/src/index.ts
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
