// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from 'fastify';
import type { ILogObj, Logger } from 'tslog';

const SCHEMA_ALREADY_PRESENT = 'FST_ERR_SCH_ALREADY_PRESENT';
const UNKNOWN_SCHEMA_KEYS = ['comment', 'javaType', 'tsEnumNames'];

export type JsonSchema = { [keyword: string]: JsonSchemaValue };

type JsonSchemaValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonSchema
  | JsonSchemaValue[];

export interface SchemaRef {
  $ref: string;
}

function isJsonSchema(value: unknown): value is JsonSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function removeUnknownSchemaKeys(schema: JsonSchema): JsonSchema {
  const schemaCopy: JsonSchema = structuredClone(schema);

  const cleanSchema = (node: JsonSchema): void => {
    for (const unknownKey of UNKNOWN_SCHEMA_KEYS) {
      if (unknownKey in node) {
        delete node[unknownKey];
      }
    }

    if ('items' in node && !Array.isArray(node.items) && 'additionalItems' in node) {
      delete node.additionalItems;
    }

    if ('additionalProperties' in node && node.type !== 'object') {
      delete node.additionalProperties;
    }

    for (const value of Object.values(node)) {
      if (isJsonSchema(value)) {
        cleanSchema(value);
      } else if (Array.isArray(value)) {
        for (const entry of value) {
          if (isJsonSchema(entry)) {
            cleanSchema(entry);
          }
        }
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
  input: object,
  schemaIdPrefix?: string,
): JsonSchema | SchemaRef | null {
  if (!isJsonSchema(input)) {
    targets.logger.error('Could not register schema because it is not an object', input);
    return null;
  }
  const schema: JsonSchema = input;
  let id = asString(schema['$id']);

  try {
    const schemaCopy = removeUnknownSchemaKeys(schema);
    if (id && schemaIdPrefix) {
      id = schemaIdPrefix + id;
      schemaCopy['$id'] = id;
    }
    const required = schemaCopy.required;
    if (Array.isArray(required) && required.length === 0) {
      delete schemaCopy.required;
    }
    const definitions = schema.definitions;
    if (isJsonSchema(definitions)) {
      for (const [key, definition] of Object.entries(definitions)) {
        if (!isJsonSchema(definition)) {
          continue;
        }
        definition['$id'] ??= key;
        registerRouteSchema(targets, definition);
      }
    }
    const properties = schemaCopy.properties;
    if (isJsonSchema(properties)) {
      for (const property of Object.values(properties)) {
        if (!isJsonSchema(property)) {
          continue;
        }
        stripDefinitionsPrefix(property);
        if (isJsonSchema(property.items)) {
          stripDefinitionsPrefix(property.items);
        }
      }
    }
    if (!id) {
      return schemaCopy;
    }
    targets.scoped.addSchema(schemaCopy);
    if (targets.root !== targets.scoped) {
      targets.root.addSchema(schemaCopy);
    }
    return { $ref: id };
  } catch (error) {
    if (isSchemaAlreadyPresent(error) && id) {
      return { $ref: id };
    }
    targets.logger.error('Could not register schema', error, schema);
    return null;
  }
}

function stripDefinitionsPrefix(node: JsonSchema): void {
  const ref = asString(node.$ref);
  if (ref) {
    node.$ref = ref.replace('#/definitions/', '');
  }
}

function isSchemaAlreadyPresent(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === SCHEMA_ALREADY_PRESENT
  );
}
