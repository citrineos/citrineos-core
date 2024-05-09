import {ValidationTypes} from 'class-validator';
import {targetConstructorToSchema} from 'class-validator-jsonschema';
import {ISchemaConverters} from 'class-validator-jsonschema/build/defaultConverters';
import {IOptions} from 'class-validator-jsonschema/build/options';
import {Constructor} from './util';
import type {SchemaObject} from 'openapi3-ts';
import {ValidationMetadata} from "class-validator/types/metadata/ValidationMetadata";
import {Price} from "../model/Price";
// @ts-ignore
import {defaultMetadataStorage} from 'class-transformer/cjs/storage.js'
// import * as defaultMetadataStorage from "class-transformer/cjs/storage";

const refPointerPrefix = '#/components/schemas/';


function getPropType(target: object, property: string) {
  if (Reflect.getMetadata('design:type', target, "total_energy_cost")) {
    console.log(Reflect.getMetadata('design:type', target, "total_energy_cost").is(Price));
  }
  return Reflect.getMetadata('design:type', target, property);
}

export {JSONSchema} from 'class-validator-jsonschema';

type Options = IOptions & {
  definitions: Record<string, SchemaObject>;
};

function nestedClassToJsonSchema(clz: Constructor<any>, options: Partial<Options>): SchemaObject {
  return targetConstructorToSchema(clz, options) as any
}


const additionalConverters: ISchemaConverters = {
  /* [IS_ARRAY]: (meta: ValidationMetadata, options: Options) => {
    if (meta.propertyName === 'tariffs' || meta.propertyName === 'signed_data') {
      console.log('IS_ARRAY', meta, options);
    }
    return {
      items: {},
      type: 'array',
      confused: true
    };
  }, */
  /* [ValidationTypes.CONDITIONAL_VALIDATION]: (meta: ValidationMetadata, options: Options) => {
    const schema1 = constraintToSchema(meta.constraints[0]);

    const typeMeta = options.classTransformerMetadataStorage
      ? options.classTransformerMetadataStorage.findTypeMetadata(meta.target as any, meta.propertyName)
      : null;

    const childType = typeMeta
      ? typeMeta.typeFunction()
      : null;

    const schema = targetToSchema(childType, options);

    // console.log('CONDITIONAL_VALIDATION', meta, options, schema1, typeMeta, childType, schema);

    // if (!options.definitions) {
    //   options.definitions = {};
    // }
    //
    // if (schema.$ref && !options.definitions[childType.name]) {
    //   options.definitions[childType.name] = nestedClassToJsonSchema(childType, options);
    // }
    //
    // const name = meta.target.name;
    //
    // if (schema.$ref === '#/components/schemas/Object') {
    //   schema.$ref = `${refPointerPrefix}${name}`;
    // }

    if (meta.propertyName === 'tariffs' || meta.propertyName === 'signed_data') {
      console.log('schema', schema);
      if (!!schema && !!schema.$ref && schema.$ref.indexOf(options.refPointerPrefix) > -1) {
        return {
          anyOf: [
            {$ref: schema.$ref},
            {
              type: null
            }
          ]
        };
      }
    }

    return schema;

    // const schema = targetToSchema(childType, options);
    //
    // return schema;
  }, */
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
      /*

            if (meta.propertyName === 'tariffs' || meta.propertyName === 'signed_data') {
              console.log('schema');
              const metadataStorage = getMetadataStorage();
              const validations = metadataStorage.getTargetValidationMetadatas(meta.target, meta.target.name, false, false);
              const propertyValidations = validations.filter(v => v.propertyName === "signed_data");
              // const metadata = Reflect.getMetadataKeys(meta.target, meta.propertyName);
              const some = Reflect.getMetadata('isOptional', meta.target.prototype, meta.propertyName);
              console.log(propertyValidations, some);
              schema.$ref += 'heerere';
            }

            console.log(childType instanceof CdrToken);


      return schema;  */
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

    return {$ref: options.refPointerPrefix + type.name}
  }
}

function constraintToSchema(primitive: any): SchemaObject | void {
  const primitives = ['string', 'number', 'boolean'];
  const type = typeof primitive;
  if (primitives.includes(type)) {
    return {type} as SchemaObject;
  }
}
