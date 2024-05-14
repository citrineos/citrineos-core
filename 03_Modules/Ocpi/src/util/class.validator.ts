import {
  getMetadataStorage,
  IS_ARRAY,
  IS_ENUM,
  ValidationTypes,
} from 'class-validator';
import { targetConstructorToSchema } from 'class-validator-jsonschema';
import { ISchemaConverters } from 'class-validator-jsonschema/build/defaultConverters';
import { IOptions } from 'class-validator-jsonschema/build/options';
import { Constructor } from './util';
import type { SchemaObject } from 'openapi3-ts';
import { ReferenceObject } from 'openapi3-ts';
import { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata';
// @ts-expect-error importing js directly from class-transformer
import { defaultMetadataStorage } from 'class-transformer/cjs/storage.js';
import { SchemaStore } from './schema.store';

export const refPointerPrefix = '#/components/schemas/';

function getPropType(target: object, property: string) {
  return Reflect.getMetadata('design:type', target, property);
}

export { JSONSchema } from 'class-validator-jsonschema';

export const nestedClassToJsonSchema = (
  clz: Constructor<any>,
  options: Partial<IOptions>,
): SchemaObject => targetConstructorToSchema(clz, options) as any;

function targetToSchema(type: any, options: IOptions): any | void {
  if (typeof type === 'function') {
    if (
      type.prototype === String.prototype ||
      type.prototype === Symbol.prototype
    ) {
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
  const propertyValidations = validations.filter(
    (v) => v.propertyName === meta.propertyName,
  );

  // Check if any of these validations are 'isArray'
  return propertyValidations.some((v) => v.name === 'isArray');
};

const additionalConverters: ISchemaConverters = {
  [IS_ENUM]: (meta: ValidationMetadata, _: IOptions) => {
    if (meta.propertyName === 'versionId') {
      console.log('h');
    }

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

    const isOptional = Reflect.getMetadata(
      'isOptional',
      (meta.target as any).prototype,
      meta.propertyName,
    );
    if (isOptional) {
      return {
        oneOf: [
          {
            type: null,
          },
          {
            $ref: `#/components/schemas/${enumName}`,
          },
        ],
      };
    } else {
      return {
        $ref: `#/components/schemas/${enumName}`,
      };
    }
  },
  [IS_ARRAY]: (meta: ValidationMetadata, options: IOptions) => {
    const isOptional = Reflect.getMetadata(
      'isOptional',
      (meta.target as any).prototype,
      meta.propertyName,
    );
    if (isOptional) {
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

      const anyOf: (SchemaObject | ReferenceObject)[] = [
        {
          type: null,
        } as any,
      ];
      if (schema && schema.$ref) {
        anyOf.unshift({
          type: 'array',
          items: {
            $ref: schema.$ref,
          },
        });
      }
      if (anyOf.length === 1) {
        return {
          type: null,
          anyOf: [
            {
              type: null,
            },
          ],
        };
      } else {
        return {
          anyOf,
          type: null,
        };
      }
    } else {
      return {
        items: {},
        type: 'array',
      };
    }
  },
  /**
   * Need below JS to make schema conversion work properly for properties annotated with @ValidateNested
   * @param meta
   * @param options
   */
  [ValidationTypes.NESTED_VALIDATION]: (
    meta: ValidationMetadata,
    options: IOptions,
  ) => {
    if (typeof meta.target === 'function') {
      const typeMeta = options.classTransformerMetadataStorage
        ? options.classTransformerMetadataStorage.findTypeMetadata(
            meta.target,
            meta.propertyName,
          )
        : null;

      const childType = typeMeta
        ? typeMeta.typeFunction()
        : getPropType(meta.target.prototype, meta.propertyName);

      const schema = targetToSchema(childType, options);

      const name = meta.target.name;

      if (
        !!schema &&
        !!schema.$ref &&
        schema.$ref === '#/components/schemas/Object'
      ) {
        schema.$ref = `${refPointerPrefix}${name}`;
      }

      const isOptional = Reflect.getMetadata(
        'isOptional',
        meta.target.prototype,
        meta.propertyName,
      );
      const isArray = getIsArray(meta);

      if (isOptional && isArray) {
        return null; // to be handled in IS_ARRAY
      }

      if (schema && schema.$ref && !SchemaStore.getSchema(childType.name)) {
        SchemaStore.addSchema(
          childType.name,
          nestedClassToJsonSchema(childType, options),
        );
      }

      if (isOptional) {
        const anyOf: (SchemaObject | ReferenceObject)[] = [
          {
            type: null,
          } as any,
        ];
        if (schema && schema.$ref) {
          const obj: SchemaObject | ReferenceObject = { $ref: schema.$ref };
          anyOf.unshift(obj);
        }
        if (anyOf.length === 1) {
          return {
            type: null,
          };
        } else {
          return {
            anyOf,
          };
        }
      } else {
        return schema;
      }
    }
  },
} as any;
export const defaultClassValidatorJsonSchemaOptions: Partial<IOptions> = {
  refPointerPrefix,
  additionalConverters,
  classTransformerMetadataStorage: defaultMetadataStorage,
};

export function classToJsonSchema(clz: Constructor<any>): SchemaObject {
  const options = { ...defaultClassValidatorJsonSchemaOptions };
  const schema = targetConstructorToSchema(clz, options) as any;
  return schema;
}
