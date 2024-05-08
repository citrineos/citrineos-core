import {JSONSchemaFaker, Schema} from 'json-schema-faker';
import {targetConstructorToSchema} from 'class-validator-jsonschema';

export class BaseController {

  generateMockResponse(model: any): Promise<any> {
    JSONSchemaFaker.option({
      useExamplesValue: true,
      useDefaultValue: true,
    });
    const response = JSONSchemaFaker.generate(targetConstructorToSchema(model) as Schema);
    return new Promise((resolve) => {
      resolve(response);
    });
  }
}
