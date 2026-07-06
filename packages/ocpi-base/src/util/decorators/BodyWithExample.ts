// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ZodTypeAny } from 'zod';
import { generateMockForSchema } from '../../controllers/BaseController.js';
import { BodyWithSchema, type BodyWithSchemaOptions } from './BodyWithSchema.js';

export const BODY_WITH_EXAMPLE_PARAM = 'BodyWithExample';

export const BodyWithExample = (
  schema: ZodTypeAny,
  name: string,
  options?: BodyWithSchemaOptions,
) =>
  function (object: NonNullable<unknown>, methodName: string, index: number) {
    const example = generateMockForSchema(schema, name).then(undefined, () => null);
    BodyWithSchema(schema, name, options)(object, methodName, index);

    // Add custom metadata for additional use cases
    Reflect.defineMetadata(BODY_WITH_EXAMPLE_PARAM, example, object, methodName);
  };
