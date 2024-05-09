import {IsOptional} from 'class-validator';
import {Cdr} from "../model/Cdr";

/**
 * Optional - mimics @IsOptional decorator but adds custom metadata so that it is easily available in
 * Reflect to check if the property is optional
 * @constructor
 */
export const Optional = () => {
  return function (object: NonNullable<unknown>, propertyName: string) {
    // Apply the standard @IsOptional() decorator
    IsOptional()(object, propertyName);

    console.log(object instanceof Cdr);
    // Add custom metadata for additional use cases
    Reflect.defineMetadata('isOptional', true, object, propertyName);
  };
};
