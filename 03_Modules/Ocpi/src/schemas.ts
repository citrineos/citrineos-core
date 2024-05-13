import { SchemaStore } from './util/schema.store';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { defaultClassValidatorJsonSchemaOptions } from './util/class.validator';

const generatedSchemas = validationMetadatasToSchemas(
  defaultClassValidatorJsonSchemaOptions,
);

export const schemas = {
  ...generatedSchemas,
  ...SchemaStore.getAllSchemas(),
};
