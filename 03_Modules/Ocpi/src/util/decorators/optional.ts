import { IsOptional } from 'class-validator';

/**
 * Optional - mimics @IsOptional decorator but adds custom metadata so that it is easily available in
 * Reflect to check if the property is optional
 * @constructor
 */
export const Optional = () =>
  function (object: NonNullable<unknown>, propertyName: string) {
    // Apply the standard @IsOptional() decorator
    IsOptional()(object, propertyName);

    // Add custom metadata for additional use cases
    Reflect.defineMetadata('isOptional', true, object, propertyName);
  };
