// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ZodTypeAny } from 'zod';
import { z } from 'zod';

/**
 * Convert a Zod schema into a self-contained JSON Schema (draft-07) suitable for
 * embedding directly in an OpenAPI `components/schemas` entry or for feeding to
 * json-schema-faker.
 *
 * We rely on Zod 4's native {@link z.toJSONSchema}
 *
 * Notes on the options:
 * - `reused: 'inline'` (the default) keeps the output self-contained so that any
 *   `$ref` it does emit resolves within the document root rather than against a
 *   local `$defs` block that would not exist once the schema is hoisted into
 *   `components/schemas`.
 * - `unrepresentable: 'any'` prevents `z.date()` / coerced dates from throwing;
 *   the `override` below then maps them to `string`/`date-time`.
 */
export function zodToOpenApiSchema(schema: ZodTypeAny): any {
  const jsonSchema: any = z.toJSONSchema(schema, {
    target: 'draft-7',
    unrepresentable: 'any',
    override: (ctx) => {
      const def = (ctx.zodSchema as any)?._zod?.def;
      if (def?.type === 'date') {
        ctx.jsonSchema.type = 'string';
        ctx.jsonSchema.format = 'date-time';
      }
    },
  });
  // The `$schema` declaration is noise inside an OpenAPI components entry.
  delete jsonSchema.$schema;
  return jsonSchema;
}
