// tslint:disable:no-submodule-imports
import * as oa from 'openapi3-ts';
import * as pathToRegexp from 'path-to-regexp';
import 'reflect-metadata';
import {ParamMetadataArgs} from 'routing-controllers/types/metadata/args/ParamMetadataArgs';

import {applyOpenAPIDecorator} from './decorators';
import {IRoute} from './index';
import {mergeDeep} from './merge.deep';
import {capitalize} from './capitalize';
import {smartcase} from './smart.case';
import {ENUM_PARAM} from '../decorators/enum.param';
import {refPointerPrefix,} from '../class.validator';
import {SchemaStore} from '../schema.store';
import {MULTIPLE_TYPES} from "../decorators/multiple.types";
import {Constructor} from "../util";

/** Return full Express path of given route. */
export function getFullExpressPath(route: IRoute): string {
  const {action, controller, options} = route;
  return (
    (options.routePrefix || '') +
    (controller.route || '') +
    (action.route || '')
  );
}

/**
 * Return OpenAPI Operation ID for given route.
 */
export function getOperationId(route: IRoute): string {
  return `${route.action.target.name}.${route.action.method}`;
}

/**
 * Return true if given metadata argument is required, checking for global
 * setting if local setting is not defined.
 */
function isRequired(meta: { required?: boolean }, route: IRoute) {
  const globalRequired = route.options?.defaults?.paramOptions?.required;
  return globalRequired ? meta.required !== false : !!meta.required;
}

/**
 * Return the content type of given route.
 */
export function getContentType(route: IRoute): string {
  const defaultContentType =
    route.controller.type === 'json'
      ? 'application/json'
      : 'text/html; charset=utf-8';
  const contentMeta = route.responseHandlers.find(
    (h) => h.type === 'content-type',
  );
  return contentMeta ? contentMeta.value : defaultContentType;
}

/**
 * Return the status code of given route.
 */
export function getStatusCode(route: IRoute): string {
  const successMeta = route.responseHandlers.find(
    (h) => h.type === 'success-code',
  );
  return successMeta ? successMeta.value + '' : '200';
}

/**
 * Return OpenAPI Responses object of given route.
 */
export function getResponses(route: IRoute): oa.ResponsesObject {
  const contentType = getContentType(route);
  const successStatus = getStatusCode(route);

  return {
    [successStatus]: {
      content: {[contentType]: {}},
      description: 'Successful response',
    },
  };
}

/**
 * Return OpenAPI Operation summary string for given route.
 */
export function getSummary(route: IRoute): string {
  return capitalize(smartcase(route.action.method));
}

/**
 * Return OpenAPI tags for given route.
 */
export function getTags(route: IRoute): string[] {
  return [smartcase(route.controller.target.name.replace(/Controller$/, ''))];
}

/**
 * Convert an Express path into an OpenAPI-compatible path.
 */
export function expressToOpenAPIPath(expressPath: string) {
  const tokens = pathToRegexp.parse(expressPath);
  return tokens
    .map((d) => (typeof d === 'string' ? d : `${d.prefix}{${d.name}}`))
    .join('');
}

/**
 * Return full OpenAPI-formatted path of given route.
 */
export function getFullPath(route: IRoute): string {
  return expressToOpenAPIPath(getFullExpressPath(route));
}

/**
 * Parse given parameter's OpenAPI Schema or Reference object using metadata
 * reflection.
 */
function getParamSchema(
  param: ParamMetadataArgs,
  forBody: boolean = false
): oa.SchemaObject | oa.ReferenceObject {
  const {explicitType, index, object, method} = param;

  if (method === 'postCommand' && param.type === 'body') {
    console.log('jh');
  }

  const type: Constructor = Reflect.getMetadata(
    'design:paramtypes',
    object,
    method,
  )[index];

  if (typeof type === 'function' && type.name === 'Array') {
    const items = explicitType
      ? {$ref: '#/components/schemas/' + explicitType.name}
      : {type: 'object' as const};
    return {items, type: 'array'};
  }
  if (explicitType) {
    return {$ref: '#/components/schemas/' + explicitType.name};
  }
  if (typeof type === 'function') {
    if (
      type.prototype === String.prototype ||
      type.prototype === Symbol.prototype
    ) {
      return {type: 'string'};
    } else if (type.prototype === Number.prototype) {
      return {type: 'number'};
    } else if (type.prototype === Boolean.prototype) {
      return {type: 'boolean'};
    } else if (type.name === 'Object') {
      // try and see if @MultipleTypes is used
      const types = Reflect.getMetadata(
        MULTIPLE_TYPES,
        param.object,
        `${param.method}.${param.index}`,
      );
      if (types) {
        console.log(types);
        return {
          oneOf: types.map((tipe: Constructor) => {
            SchemaStore.addToSchemaStore(tipe);
            return {$ref: '#/components/schemas/' + tipe.name};
          }),
        };
      } else {
        return {};
      }
    } else {
      SchemaStore.addToSchemaStore(type);
      return {$ref: '#/components/schemas/' + type.name};
    }
  }

  return {};
}

function getParamSchemaForBody(
  param: ParamMetadataArgs,
): oa.SchemaObject | oa.ReferenceObject {
  return getParamSchema(param, true);
}

/**
 * Return header parameters of given route.
 */
export function getHeaderParams(route: IRoute): oa.ParameterObject[] {
  const headers: oa.ParameterObject[] = route.params
    .filter((p) => p.type === 'header')
    .map((headerMeta) => {
      const schema = getParamSchema(headerMeta) as oa.SchemaObject;
      return {
        in: 'header' as oa.ParameterLocation,
        name: headerMeta.name || '',
        required: isRequired(headerMeta, route),
        schema,
      };
    });

  const headersMeta = route.params.find((p) => p.type === 'headers');
  if (headersMeta) {
    const schema = getParamSchema(headersMeta) as oa.ReferenceObject;
    headers.push({
      in: 'header',
      name: schema.$ref.split('/').pop() || '',
      required: isRequired(headersMeta, route),
      schema,
    });
  }

  return headers;
}


/**
 * Return OpenAPI requestBody of given route, if it has one.
 */
export function getRequestBody(route: IRoute): oa.RequestBodyObject | void {
  const bodyParamMetas = route.params.filter((d) => d.type === 'body-param');
  const bodyParamsSchema: oa.SchemaObject | null =
    bodyParamMetas.length > 0
      ? bodyParamMetas.reduce(
        (acc: oa.SchemaObject, d) => ({
          ...acc,
          properties: {
            ...acc.properties,
            [d.name!]: getParamSchema(d),
          },
          required: isRequired(d, route)
            ? [...(acc.required || []), d.name!]
            : acc.required,
        }),
        {properties: {}, required: [], type: 'object'},
      )
      : null;

  const bodyMeta = route.params.find((d) => d.type === 'body');

  if (bodyMeta) {
    const bodySchema = getParamSchema(bodyMeta);
    // const ref =
    //   'items' in bodySchema && bodySchema.items ? bodySchema.items : bodySchema;
    // const $ref = { $ref: ref };

    return {
      content: {
        'application/json': {
          schema: bodyParamsSchema
            ? {allOf: [bodySchema, bodyParamsSchema]}
            : bodySchema,
        },
      },
      required: isRequired(bodyMeta, route),
    };
  } else if (bodyParamsSchema) {
    return {
      content: {'application/json': {schema: bodyParamsSchema}},
    };
  }
}

/**
 * Return path parameters of given route.
 *
 * Path parameters are first parsed from the path string itself, and then
 * supplemented with possible @Param() decorator values.
 */
export function getPathParams(route: IRoute): oa.ParameterObject[] {
  const path = getFullExpressPath(route);
  const tokens = pathToRegexp.parse(path);
  const params = route.params.filter((param) => param.type === 'param');

  if (params.length > 0) {
    return params.map((param) => {
      const enumName = Reflect.getMetadata(
        ENUM_PARAM,
        param.object,
        `${param.method}.${param.name}`,
      );
      if (enumName) {
        return {
          in: 'path',
          name: param.name,
          required: true,
          schema: {
            $ref: `${refPointerPrefix}${enumName}`,
          },
        };
      } else {
        return {
          in: 'path',
          name: param.name,
          required: true,
          allowEmptyValue: false,
          schema: {type: 'string'},
        };
      }
    }) as oa.ParameterObject[];
  }

  return tokens
    .filter((token) => token && typeof token === 'object') // Omit non-parameter plain string tokens
    .map((t: unknown) => {
      const token = t as pathToRegexp.Key;
      const name = token.name + '';
      const param: oa.ParameterObject = {
        in: 'path',
        name,
        required: token.modifier !== '?',
        schema: {type: 'string'},
      };

      if (token.pattern && token.pattern !== '[^\\/]+?') {
        param.schema = {pattern: token.pattern, type: 'string'};
      }

      const meta = route.params.find(
        (p) => p.name === name && p.type === 'param',
      );
      if (meta) {
        const metaSchema = getParamSchema(meta);
        param.schema =
          'type' in metaSchema
            ? {...param.schema, ...metaSchema}
            : metaSchema;
      }

      return param;
    });
}

/**
 * Return query parameters of given route.
 */
export function getQueryParams(
  route: IRoute,
  schemas: { [p: string]: oa.SchemaObject },
): oa.ParameterObject[] {
  const queries: oa.ParameterObject[] = route.params
    .filter((p) => p.type === 'query')
    .map((queryMeta) => {
      const schema = getParamSchema(queryMeta) as oa.SchemaObject;
      return {
        in: 'query' as oa.ParameterLocation,
        name: queryMeta.name || '',
        required: isRequired(queryMeta, route),
        schema,
      };
    });

  const queriesMeta = route.params.find((p) => p.type === 'queries');
  if (queriesMeta) {
    const paramSchema = getParamSchema(queriesMeta) as oa.ReferenceObject;
    // the last segment after '/'
    const paramSchemaName = paramSchema.$ref.split('/').pop() || '';
    const currentSchema = schemas[paramSchemaName];

    for (const [name, schema] of Object.entries(
      currentSchema?.properties || {},
    )) {
      queries.push({
        in: 'query',
        name,
        required: currentSchema.required?.includes(name),
        schema,
      });
    }
  }
  return queries;
}

/**
 * Return OpenAPI Operation object for given route.
 */
export function getOperation(
  route: IRoute,
  schemas: { [p: string]: oa.SchemaObject },
): oa.OperationObject {
  const operation: oa.OperationObject = {
    operationId: getOperationId(route),
    parameters: [
      ...getHeaderParams(route),
      ...getPathParams(route),
      ...getQueryParams(route, schemas),
    ],
    requestBody: getRequestBody(route) || undefined,
    responses: getResponses(route),
    summary: getSummary(route),
    tags: getTags(route),
  };

  const cleanedOperation = Object.entries(operation)
    .filter(
      ([_, value]) => value && (value.length || Object.keys(value).length),
    )
    .reduce(
      (acc: any, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as unknown as oa.OperationObject,
    );

  return applyOpenAPIDecorator(cleanedOperation, route);
}

/**
 * Return OpenAPI Paths Object for given routes
 */
export function getPaths(
  routes: IRoute[],
  schemas: { [p: string]: oa.SchemaObject },
): oa.PathObject {
  const routePaths = routes.map((route) => ({
    [getFullPath(route)]: {
      [route.action.type]: getOperation(route, schemas),
    },
  }));

  // @ts-expect-error: array spread
  return mergeDeep(...routePaths);
}

/**
 * Return OpenAPI specification for given routes.
 */
export function getSpec(
  routes: IRoute[],
  schemas: { [p: string]: oa.SchemaObject },
): oa.OpenAPIObject {
  return {
    components: {schemas: {}},
    info: {title: '', version: '1.0.0'},
    openapi: '3.0.0',
    paths: getPaths(routes, schemas),
  };
}
