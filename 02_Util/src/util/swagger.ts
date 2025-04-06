// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable */

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { FastifyInstance, FastifyRequest } from 'fastify';
import fs from 'fs';
import { HttpHeader, HttpStatus, SystemConfig, UnauthorizedError } from '@citrineos/base';
import * as FastifyAuth from '@fastify/auth';
import * as packageJson from '../../package.json';
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

/**
 * This transformation is used to set default tags
 *
 * @param {object} swaggerObject - The original Swagger object to be transformed.
 * @param {object} openapiObject - The original OpenAPI object to be transformed.
 * @return {object} The transformed OpenAPI object.
 */
function OcppTransformObject({
  swaggerObject,
  openapiObject,
}: {
  swaggerObject: Partial<OpenAPIV2.Document>;
  openapiObject: Partial<OpenAPIV3.Document | OpenAPIV3_1.Document>;
}) {
  console.log('OcppTransformObject: Transforming OpenAPI object...');
  if (openapiObject.paths && openapiObject.components) {
    for (const pathKey in openapiObject.paths) {
      const path: OpenAPIV3.PathsObject = openapiObject.paths[pathKey] as OpenAPIV3.PathsObject;
      if (path) {
        for (const methodKey in path) {
          const method: OpenAPIV3.OperationObject = path[methodKey] as OpenAPIV3.OperationObject;
          if (method) {
            // Set tags based on path key if tags were not passed in
            if (!method.tags) {
              // Get tag index
              // e.g, '/ocpp/1.6/evdriver' -> 'evdriver'
              // e.g, '/data/evdriver' -> 'evdriver'
              const tagIndex = pathKey.includes('data') ? 2 : 3;
              method.tags = pathKey
                .split('/')
                .slice(tagIndex, -1)
                .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1));
            }
          }
        }
      }
    }
  }
  return openapiObject;
}

const registerSwaggerUi = (systemConfig: SystemConfig, server: FastifyInstance) => {
  const swaggerUiOptions: any = {
    routePrefix: systemConfig.util.swagger?.path,
    securityDefinitions: {
      authorization: {
        name: 'authorization',
        type: 'apiKey',
        in: 'header',
      },
    },
    exposeRoute: true,
    uiConfig: {
      filter: true,
    },
    theme: {
      title: 'CitrineOS Central System API',
      css: [
        {
          filename: '',
          content:
            '.swagger-ui .topbar { background-color: #fafafa; } .swagger-ui .topbar .download-url-wrapper { display: none; }',
        },
      ],
    },
  };

  if (systemConfig.util.swagger?.logoPath) {
    swaggerUiOptions['logo'] = {
      type: 'image/png',
      content: fs.readFileSync(systemConfig.util.swagger?.logoPath),
    };
  }

  server.register(fastifySwaggerUi, swaggerUiOptions);
};

export const getHeaderValue = (headers: string[], key: string): string | undefined => {
  for (let i = 0; i < headers.length; i += 2) {
    if (headers[i].toLowerCase() === key.toLowerCase()) {
      return headers[i + 1];
    }
  }
  return undefined;
};

const getTokenFromAuthHeader = (authorizationHeader: string | undefined): string | undefined => {
  if (!!authorizationHeader) {
    const token = authorizationHeader.split('Bearer ')[1];
    return token;
  }
  return undefined;
};

const getAuthorizationTokenFromRawHeaders = (headers: string[]): string | undefined => {
  const authorizationHeader = getHeaderValue(headers, HttpHeader.Authorization);
  return getTokenFromAuthHeader(authorizationHeader);
};

export const getAuthorizationTokenFromRequest = (request: FastifyRequest): string => {
  const token = getAuthorizationTokenFromRawHeaders(request.raw.rawHeaders);
  if (!token) {
    throw new UnauthorizedError('Token not found in headers');
  }
  return token;
};

const registerFastifyAuth = async (server: FastifyInstance) => {
  await server.register(FastifyAuth as any).after();
  console.log((server as any).authorization);

  server.decorate('authorization', function (request: any, reply: any, done: any) {
    try {
      const token = getAuthorizationTokenFromRequest(request);
      console.log('Received authorization token', token);
      done();
    } catch (e) {
      reply.code(HttpStatus.UNAUTHORIZED);
    }
  });
};

const buildLocalReference = (json: any, _parent: unknown, _property: unknown, i: number) => {
  // If title is missing but $id is available, set title to $id
  if (!json.title && json.$id) {
    json.title = json.$id;
  }

  // Return title if available, otherwise fallback to $id, or def-<index> as a last resort
  return json.title || json.$id || `def-${i}`;
};

const registerFastifySwagger = (systemConfig: SystemConfig, server: FastifyInstance) => {
  server.register(fastifySwagger as any, {
    openapi: {
      info: {
        title: 'CitrineOS Central System API',
        description: 'Central System API for OCPP 2.0.1 messaging.',
        version: packageJson.version,
      },
      components: {
        securitySchemes: {
          authorization: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    },
    transformObject: OcppTransformObject,
    refResolver: {
      buildLocalReference,
    },
  });
};

export async function initSwagger(systemConfig: SystemConfig, server: FastifyInstance) {
  registerFastifySwagger(systemConfig, server);
  registerSwaggerUi(systemConfig, server);
  await registerFastifyAuth(server);
}
