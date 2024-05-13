import {SchemaStore} from './util/schema.store';
import {validationMetadatasToSchemas} from 'class-validator-jsonschema';
import {defaultClassValidatorJsonSchemaOptions} from './util/class.validator';
import {VersionNumber, VersionNumberEnumName} from "./model/VersionNumber";
import {SchemaObject} from "openapi3-ts";

const generatedSchemas = validationMetadatasToSchemas(
  defaultClassValidatorJsonSchemaOptions,
);

export const schemas = {
  [VersionNumberEnumName]: {
    type: 'string',
    enum: Object.values(VersionNumber),
  } as SchemaObject,
  ...generatedSchemas,
  ...SchemaStore.getAllSchemas(),
};
