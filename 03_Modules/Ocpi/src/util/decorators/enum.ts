import { IsEnum } from 'class-validator';

/**
 * Extends @IsEnum decorator to add custom metadata so that it is easily available in additionalConverters
 * @param enumType - the enum
 * @param enumName - name of the resulting enum schema
 * @constructor
 */
export const Enum = (enumType: any, enumName: string) =>
  function (object: NonNullable<unknown>, propertyName: string) {
    // Apply the standard @IsOptional() decorator
    IsEnum(enumType)(object, propertyName);

    // Add custom metadata for additional use cases
    Reflect.defineMetadata('isEnum', enumName, object, propertyName);
  };
