import { JSONSchemaFaker } from 'json-schema-faker';
import { classToJsonSchema } from '../util/class.validator';
import { getAllSchemas } from '../schemas';
import { SchemaObject } from 'openapi3-ts';

export class BaseController {
  generateMockOcpiResponse(model: any): Promise<any> {
    (JSONSchemaFaker.format as any)('url', (url: any) => url);
    JSONSchemaFaker.option({
      useExamplesValue: true,
      useDefaultValue: true,
    });
    const schema: SchemaObject = classToJsonSchema(model);
    (schema as any).components = {
      schemas: getAllSchemas(),
    };
    console.log('schema', schema);
    try {
      const response = JSONSchemaFaker.generate(schema as any);
      console.log('response', response);
      return new Promise((resolve) => {
        resolve(response);
      });
    } catch (err) {
      console.log('err', err);
      return new Promise((resolve, reject) => {
        reject(null);
      });
    }
  }
}
