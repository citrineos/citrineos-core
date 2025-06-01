export interface QuerySchemaProperties {
  key: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
}

/**
 * Utility function for creating querystring schemas for fastify route definitions
 * @param name - The name of the schema
 * @param {QuerySchemaProperties} properties An array of objects each representing a unique property. Properties with types ending in '[]' will be treated as arrays of that type.
 * @returns
 */
export const QuerySchema = (name: string, properties: QuerySchemaProperties[]): object => {
  const schema: Record<string, string | object> = {
    $id: name,
    type: 'object',
    properties: {},
  };

  const required: string[] = [];

  properties.forEach((property: QuerySchemaProperties) => {
    const { key, type, defaultValue, required: isRequired } = property;

    if (isRequired) {
      required.push(key);
    }

    // '[]' denotes an array
    if (type.endsWith('[]')) {
      (schema['properties'] as Record<string, object>)[key] = {
        type: 'array',
        items: { type: type.slice(0, -2) }, // Remove '[]' to get the base type
      };
    } else {
      // non-array types
      (schema['properties'] as Record<string, string | object>)[key] = {
        type,
        default: defaultValue,
      };
    }
  });

  if (required.length > 0) {
    schema['required'] = [...required];
  }
  return schema;
};

export const MessageConfirmationSchema = QuerySchema('MessageConfirmationSchema', [
  {
    key: 'success',
    type: 'boolean',
    required: true,
  },
  {
    key: 'payload',
    type: 'string',
  },
]);
