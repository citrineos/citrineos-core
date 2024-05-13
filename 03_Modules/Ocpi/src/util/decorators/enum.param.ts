import { Param } from 'routing-controllers';

export const ENUM_PARAM = 'EnumParam';

/**
 * Extends @Params decorator to add custom metadata so that it is easily available to convert Swagger UI schema route
 * params to have $refs appropriately
 * @constructor
 * @param clazz
 * @param options
 */
export const EnumParam = (name: string, enumType: any, enumName: string) =>
  function (object: NonNullable<unknown>, methodName: string, index: number) {
    // Apply the standard @Params() decorator
    Param(name)(object, methodName, index);

    // Add custom metadata for additional use cases
    Reflect.defineMetadata(
      ENUM_PARAM,
      enumName,
      object,
      `${methodName}.${name}`,
    );
  };
