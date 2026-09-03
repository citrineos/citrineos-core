// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { generate, registerFormat } from 'json-schema-faker';
import { getAllSchemas } from '../openapi-spec-helper/schemas.js';
import type { PaginatedCdrResponse } from '../model/cdr.js';
import { PaginatedParams } from './param/paginated-params.js';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../model/paginated-response.js';
import { zodToOpenApiSchema } from '../openapi-spec-helper/zod-to-json-schema.js';
import type { ZodTypeAny } from 'zod';
import type { ILogObj, Logger } from 'tslog';
import type { OcpiDependencies } from '../dependencies.js';

registerFormat('url', () => 'https://example.com');

export const generateMockForSchema = async (schema: ZodTypeAny, name: string): Promise<any> => {
  const jsonSchema: any = zodToOpenApiSchema(schema);
  (jsonSchema as any).components = {
    schemas: getAllSchemas(),
  };
  try {
    return await generate(jsonSchema, {
      useExamplesValue: true,
      useDefaultValue: true,
    });
  } catch (err) {
    console.log('err', err);
    return null;
  }
};

export const generateMockOcpiPaginatedResponse = async (
  schema: any,
  name: string,
  paginationParams?: PaginatedParams,
): Promise<any> => {
  const response = (await generateMockForSchema(schema, name)) as PaginatedCdrResponse;
  if (response) {
    response.limit = paginationParams?.limit || DEFAULT_LIMIT;
    response.offset = paginationParams?.offset || DEFAULT_OFFSET;
    response.total = 50; // todo for now but will be set
  }
  return response;
};

export class BaseController {
  protected readonly logger: Logger<ILogObj>;

  constructor({ logger }: OcpiDependencies) {
    this.logger = logger;
  }

  generateMockOcpiResponse = async (model: any, name: string): Promise<any> =>
    generateMockForSchema(model, name);
  generateMockOcpiPaginatedResponse = async (
    model: any,
    name: string,
    paginationParams?: PaginatedParams,
  ): Promise<any> => generateMockOcpiPaginatedResponse(model, name, paginationParams);
}
