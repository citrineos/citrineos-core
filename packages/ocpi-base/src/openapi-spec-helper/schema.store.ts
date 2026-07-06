// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ZodTypeAny } from 'zod';
import { zodToOpenApiSchema } from './zod.to.json.schema.js';

export const SchemaStore = {
  components: {
    schemas: {},
  },

  addSchema(name: string, schema: object) {
    (this.components.schemas as any)[name] = schema;
  },

  getSchema(name: string) {
    return (this.components.schemas as any)[name] as any;
  },

  getAllSchemas() {
    return this.components.schemas;
  },

  addToSchemaStore(schema: ZodTypeAny, name: string) {
    if (!this.getSchema(name)) {
      this.addSchema(name, zodToOpenApiSchema(schema));
    }
  },
};
