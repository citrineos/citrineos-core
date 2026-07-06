// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  getMetadataStorage,
  IS_ARRAY,
  IS_DATE_STRING,
  IS_ENUM,
  ValidationTypes,
} from 'class-validator';
import { targetConstructorToSchema } from 'class-validator-jsonschema';
import type { ISchemaConverters } from 'class-validator-jsonschema/build/defaultConverters.js';
import type { IOptions } from 'class-validator-jsonschema/build/options.js';
import type { SchemaObject } from 'openapi3-ts';
import type { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata.js';
// @ts-expect-error importing js directly from class-transformer
import { defaultMetadataStorage } from 'class-transformer/cjs/storage.js';
import { SchemaStore } from './schema.store.js';
import { OPTIONAL_PARAM } from '../util/decorators/Optional.js';
import type { Constructable } from 'typedi';

export const refPointerPrefix = '#/components/schemas/';

function getPropType(target: object, property: string) {
  return Reflect.getMetadata('design:type', target, property);
}

export { JSONSchema } from 'class-validator-jsonschema';

export const nestedClassToJsonSchema = (
  clz: Constructable<any>,
  options: Partial<IOptions>,
): SchemaObject => targetConstructorToSchema(clz, options) as any;

function targetToSchema(type: any, options: IOptions): any | void {
  if (typeof type === 'function') {
    if (type.prototype === String.prototype || type.prototype === Symbol.prototype) {
      return { type: 'string' };
    } else if (type.prototype === Number.prototype) {
      return { type: 'number' };
    } else if (type.prototype === Boolean.prototype) {
      return { type: 'boolean' };
    }

    return { $ref: options.refPointerPrefix + type.name };
  }
}

const getIsArray = (meta: ValidationMetadata): boolean => {
  const metadataStorage = getMetadataStorage();

  const validations = metadataStorage.getTargetValidationMetadatas(
    meta.target as any,
    (meta.target as any).name,
    false,
    false,
  );

  // Find validations for the specific property
  const propertyValidations = validations.filter((v) => v.propertyName === meta.propertyName);

  // Check if any of these validations are 'isArray'
  return propertyValidations.some((v) => v.name === 'isArray');
};

const additionalConverters: ISchemaConverters = {
  [IS_DATE_STRING]: (_meta: ValidationMetadata, _: IOptions) => ({
    format: 'date-time',
    type: 'string',
  }),
  [IS_ENUM]: (meta: ValidationMetadata, _: IOptions) => {
    const enumObject = meta.constraints[0]; // Assuming the first constraint is the enum object

    const enumName = Reflect.getMetadata(
      'isEnum',
      (meta.target as any).prototype,
      meta.propertyName,
    );

    if (enumName) {
      // Check if the enum schema is already in the store, if not add it
      if (!SchemaStore.getSchema(enumName)) {
        const enumValues = Object.values(enumObject);
        SchemaStore.addSchema(enumName, {
          type: 'string',
          enum: enumValues,
        });
      }
    }

    return {
      $ref: `#/components/schemas/${enumName}`,
    };
  },
  [IS_ARRAY]: (meta: ValidationMetadata, options: IOptions) => {
    const typeMeta = options.classTransformerMetadataStorage
      ? options.classTransformerMetadataStorage.findTypeMetadata(
          meta.target as any,
          meta.propertyName,
        )
      : null;

    const childType = typeMeta
      ? typeMeta.typeFunction()
      : getPropType((meta.target as any).prototype, meta.propertyName);

    const schema = targetToSchema(childType, options);
    const isOptional = Reflect.getMetadata(
      OPTIONAL_PARAM,
      (meta.target as any).prototype,
      meta.propertyName,
    );
    if (isOptional) {
      if (schema && schema.$ref) {
        if (!SchemaStore.getSchema(childType.name)) {
          SchemaStore.addSchema(childType.name, nestedClassToJsonSchema(childType, options));
        }
        return {
          type: 'array',
          nullable: true,
          items: {
            $ref: schema.$ref,
          },
        };
      } else {
        return {
          nullable: true,
        };
      }
    } else {
      if (schema && schema.$ref) {
        if (!SchemaStore.getSchema(childType.name)) {
          SchemaStore.addSchema(childType.name, nestedClassToJsonSchema(childType, options));
        }
        return {
          type: 'array',
          items: {
            $ref: schema.$ref,
          },
        };
      } else {
        return {
          type: 'array',
        };
      }
    }
  },

  /**
   * Need below JS to make schema conversion work properly for properties annotated with @ValidateNested
   * @param meta
   * @param options
   */
  [ValidationTypes.NESTED_VALIDATION]: (meta: ValidationMetadata, options: IOptions) => {
    if (typeof meta.target === 'function') {
      const typeMeta = options.classTransformerMetadataStorage
        ? options.classTransformerMetadataStorage.findTypeMetadata(meta.target, meta.propertyName)
        : null;

      const childType = typeMeta
        ? typeMeta.typeFunction()
        : getPropType(meta.target.prototype, meta.propertyName);

      const schema = targetToSchema(childType, options);

      const name = meta.target.name;

      if (!!schema && !!schema.$ref && schema.$ref === '#/components/schemas/Object') {
        schema.$ref = `${refPointerPrefix}${name}`;
      }

      const isOptional = Reflect.getMetadata(
        OPTIONAL_PARAM,
        meta.target.prototype,
        meta.propertyName,
      );
      const isArray = getIsArray(meta);

      if (schema && schema.$ref && !SchemaStore.getSchema(childType.name)) {
        SchemaStore.addSchema(childType.name, nestedClassToJsonSchema(childType, options));
      }

      if (isOptional && isArray) {
        return null; // rest to be handled in IS_ARRAY
      }

      if (isOptional) {
        if (schema && schema.$ref) {
          return {
            nullable: true,
            $ref: schema.$ref,
          };
        } else {
          return {
            nullable: true,
          };
        }
      } else {
        return schema;
      }
    }
  },
} as any;

/**
 * Since we are using class-validator annotations and class-validator-jsonschema dependency to generate JSON schemas
 * for the classes, we needed to extend / customize the schema generation behavior via the additionalConverters defined
 * above. Similar to {@link routingControllersToSpec}, this is needed to ensure that the generated OpenAPI specification is
 * using $refs.
 */
export const defaultClassValidatorJsonSchemaOptions: Partial<IOptions> = {
  refPointerPrefix,
  additionalConverters,
  classTransformerMetadataStorage: defaultMetadataStorage,
};

export function classToJsonSchema(clz: Constructable<any>): SchemaObject {
  const options = { ...defaultClassValidatorJsonSchemaOptions };
  const schema = targetConstructorToSchema(clz, options) as any;
  return schema;
}
