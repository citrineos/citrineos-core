// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable */

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';
import fs from 'fs';
import { SystemConfig } from '@citrineos/base';
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

/**
 * This transformation is necessary because the plugin (@fastify/swagger) does not handle the local #ref objects correctly.
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
  if (openapiObject.paths && openapiObject.components) {
    for (const pathKey in openapiObject.paths) {
      const path: OpenAPIV3.PathsObject = openapiObject.paths[
        pathKey
      ] as OpenAPIV3.PathsObject;
      if (path) {
        for (const methodKey in path) {
          const method: OpenAPIV3.OperationObject = path[
            methodKey
          ] as OpenAPIV3.OperationObject;
          if (method) {
            // Set tags based on path key
            method.tags = pathKey
              .split('/')
              .slice(2, -1)
              .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1));

            const requestBody: OpenAPIV3.RequestBodyObject =
              method.requestBody as OpenAPIV3.RequestBodyObject;
            if (requestBody) {
              for (const mediaTypeObjectKey in requestBody.content) {
                const mediaTypeObject: OpenAPIV3.MediaTypeObject = requestBody
                  .content[mediaTypeObjectKey] as OpenAPIV3.MediaTypeObject;
                if (mediaTypeObject) {
                  const schema: any =
                    mediaTypeObject.schema as OpenAPIV3.SchemaObject;
                  if (schema) {
                    const refSchemas = schema['definitions'];
                    delete schema['definitions'];
                    delete schema['comment'];
                    for (const key in refSchemas) {
                      delete refSchemas[key]['javaType'];
                      delete refSchemas[key]['tsEnumNames'];
                      delete refSchemas[key]['additionalProperties'];
                    }
                    openapiObject.components.schemas = {
                      ...openapiObject.components.schemas,
                      ...refSchemas,
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return openapiObject;
}

export function initSwagger(
  systemConfig: SystemConfig,
  server: FastifyInstance,
) {
  server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'CitrineOS Central System API',
        description: 'Central System API for OCPP 2.0.1 messaging.',
        version: '1.3.0',
      },
    },
    transformObject: OcppTransformObject,
  });

  const swaggerUiOptions: any = {
    routePrefix: systemConfig.util.swagger?.path,
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
}
