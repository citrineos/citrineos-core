export const MULTIPLE_TYPES = 'MultipleTypes';

/**
 * Allows us to pass in a list of types for objects that have multiple types. This will set the
 * list of types in Reflect using MULTIPLE_TYPES as the key.
 * This decorator is to be applied to a function argument such as in conjunction with @Body().
 * The value list of types that is set here will be consumed via MULTIPLE_TYPES key when we generate
 * the OpenApi spec to ensure that anyOf is applied correctly.
 * @constructor
 * @param types
 */
export const MultipleTypes = (...types: any[]) =>
  function (object: NonNullable<unknown>, methodName: string, index: number) {

    // Add custom metadata for additional use cases
    Reflect.defineMetadata(
      MULTIPLE_TYPES,
      types,
      object,
      `${methodName}.${index}`,
    );
  };
