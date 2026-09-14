// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from 'fastify';
import type { ILogObj, Logger } from 'tslog';

const SCHEMA_ALREADY_PRESENT = 'FST_ERR_SCH_ALREADY_PRESENT';
const UNKNOWN_SCHEMA_KEYS = ['comment', 'javaType', 'tsEnumNames'];

export function removeUnknownSchemaKeys(schema: any): any {
  const schemaCopy = structuredClone(schema);

  const cleanSchema = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const unknownKey of UNKNOWN_SCHEMA_KEYS) {
      if (unknownKey in obj) {
        delete obj[unknownKey];
      }
    }

    if ('items' in obj && !Array.isArray(obj.items) && 'additionalItems' in obj) {
      delete obj.additionalItems;
    }

    if ('additionalProperties' in obj && obj.type !== 'object') {
      delete obj.additionalProperties;
    }

    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        cleanSchema(obj[key]);
      }
    }
  };

  cleanSchema(schemaCopy);
  return schemaCopy;
}

export interface SchemaRegistrationTargets {
  scoped: FastifyInstance;
  root: FastifyInstance;
  logger: Logger<ILogObj>;
}

export function registerRouteSchema(
  targets: SchemaRegistrationTargets,
  schema: any,
  schemaIdPrefix?: string,
): object | null {
  let id = schema['$id'];
  if (!id) {
    targets.logger.error('Could not register schema because no ID', schema);
  }

  try {
    const schemaCopy = removeUnknownSchemaKeys(schema);
    if (id && schemaIdPrefix) {
      id = schemaIdPrefix + id;
      schemaCopy['$id'] = id;
    }
    if (
      schemaCopy.required &&
      Array.isArray(schemaCopy.required) &&
      schemaCopy.required.length === 0
    ) {
      delete schemaCopy.required;
    }
    if (schema.definitions) {
      Object.keys(schema.definitions).forEach((key) => {
        const definition = schema.definitions[key];
        if (!definition['$id']) {
          definition['$id'] = key;
        }
        registerRouteSchema(targets, definition);
      });
    }
    if (schemaCopy.properties) {
      Object.keys(schemaCopy.properties).forEach((key) => {
        const property = schemaCopy.properties[key];
        if (property.$ref) {
          property.$ref = property.$ref.replace('#/definitions/', '');
        }
        if (property.items && property.items.$ref) {
          property.items.$ref = property.items.$ref.replace('#/definitions/', '');
        }
      });
    }
    targets.scoped.addSchema(schemaCopy);
    targets.root.addSchema(schemaCopy);
    return { $ref: `${id}` };
  } catch (e: any) {
    if (e.code === SCHEMA_ALREADY_PRESENT) {
      return { $ref: `${id}` };
    }
    targets.logger.error('Could not register schema', e, schema);
    return null;
  }
}
