import {ValidationTypes} from 'class-validator';
import {targetConstructorToSchema} from 'class-validator-jsonschema';
import {ISchemaConverters} from 'class-validator-jsonschema/build/defaultConverters';
import {IOptions} from 'class-validator-jsonschema/build/options';
import {Constructor} from './util';
import type {SchemaObject} from 'openapi3-ts';
import {ValidationMetadata} from 'class-validator/types/metadata/ValidationMetadata';
// @ts-expect-error importing js directly from class-transformer
import {defaultMetadataStorage} from 'class-transformer/cjs/storage.js';

const refPointerPrefix = '#/components/schemas/';


function getPropType(target: object, property: string) {
  return Reflect.getMetadata('design:type', target, property);
}

export {JSONSchema} from 'class-validator-jsonschema';

type Options = IOptions & {
  definitions: Record<string, SchemaObject>;
};

function nestedClassToJsonSchema(clz: Constructor<any>, options: Partial<Options>): SchemaObject {
  return targetConstructorToSchema(clz, options) as any;
}


const additionalConverters: ISchemaConverters = {
  [ValidationTypes.NESTED_VALIDATION]: (meta: ValidationMetadata, options: Options) => {
    if (typeof meta.target === 'function') {

      if (meta.propertyName === 'total_fixed_cost' || meta.propertyName === 'total_cost') {
        console.log('here');
      }

      const typeMeta = options.classTransformerMetadataStorage
        ? options.classTransformerMetadataStorage.findTypeMetadata(meta.target, meta.propertyName)
        : null;

      const childType = typeMeta
        ? typeMeta.typeFunction()
        : getPropType(meta.target.prototype, meta.propertyName);

      const schema = targetToSchema(childType, options);

      if (!options.definitions) {
        options.definitions = {};
      }

      if (schema.$ref && !options.definitions[childType.name]) {
        options.definitions[childType.name] = nestedClassToJsonSchema(childType, options);
      }

      const name = meta.target.name;

      if (schema.$ref === '#/components/schemas/Object') {
        schema.$ref = `${refPointerPrefix}${name}`;
      }

      const isOptional = Reflect.getMetadata('isOptional', meta.target.prototype, meta.propertyName);

      if (isOptional) {
        return {
          anyOf: [
            {$ref: schema.$ref},
            {
              type: null
            }
          ]
        };
      } else {
        return schema;
      }
    }
  },
} as any;
export const defaultClassValidatorJsonSchemaOptions: Partial<Options> = {
  refPointerPrefix,
  additionalConverters,
  classTransformerMetadataStorage: defaultMetadataStorage
};

export function classToJsonSchema(clz: Constructor<any>): SchemaObject {
  const options = {...defaultClassValidatorJsonSchemaOptions, definitions: {}};
  const schema = targetConstructorToSchema(clz, options) as any;
  schema.definitions = options.definitions;
  return schema;
}

function targetToSchema(type: any, options: IOptions): any | void {
  if (typeof type === 'function') {
    if (type.prototype === String.prototype || type.prototype === Symbol.prototype) {
      return {type: 'string'};
    } else if (type.prototype === Number.prototype) {
      return {type: 'number'};
    } else if (type.prototype === Boolean.prototype) {
      return {type: 'boolean'};
    }

    return {$ref: options.refPointerPrefix + type.name};
  }
}
