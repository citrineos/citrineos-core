// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createParamDecorator } from 'routing-controllers';
import { z } from 'zod';
import { InvalidParamException } from '../../exception/InvalidParamException.js';

export const BODY_PARAM = 'BodyParam';

export interface BodyWithSchemaOptions {
  /**
   * Validate against a partial version of the schema (all top-level fields made
   * optional). Use for PATCH endpoints that accept a partial representation.
   * Only applies when the schema is a `ZodObject`.
   */
  partial?: boolean;
  /**
   * Whether a request body is required. Defaults to `true`.
   */
  required?: boolean;
}

/**
 * Format Zod issues into a single, client-facing message listing each offending
 * field and why it failed, e.g.
 * `Invalid request body: whitelist: Required, valid: Required`.
 */
const formatIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join(', ');

/**
 * Binds the request body to the decorated parameter and validates it against the
 * given Zod schema *before* the controller action runs. On failure an
 * {@link InvalidParamException} is thrown, which the global OCPI exception
 * handler maps to a 400 with status code `ClientInvalidOrMissingParameters` and
 * the list of offending fields. On success the parsed (and coerced) value is
 * injected.
 *
 * The schema/name are also recorded in reflect metadata so the OpenAPI spec
 * generator can emit the request body schema reference.
 */
export const BodyWithSchema = (
  schema: z.ZodSchema<any>,
  name: string,
  options: BodyWithSchemaOptions = {},
) =>
  function (object: NonNullable<unknown>, methodName: string, index: number) {
    const { partial = false, required = true } = options;

    createParamDecorator({
      required,
      value: (action) => {
        const body = action.request?.body;
        const validationSchema =
          partial && schema instanceof z.ZodObject ? schema.partial() : schema;
        const result = validationSchema.safeParse(body);
        if (!result.success) {
          throw new InvalidParamException(`Invalid request body: ${formatIssues(result.error)}`);
        }
        return result.data;
      },
    })(object, methodName, index);

    Reflect.defineMetadata(
      BODY_PARAM,
      {
        schema,
        name,
      },
      object,
      `${methodName}.${index}`,
    );
  };
