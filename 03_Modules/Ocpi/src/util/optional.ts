import {IsOptional} from 'class-validator';
import {Cdr} from "../model/Cdr";

export const Optional = () => {
  return function (object: NonNullable<unknown>, propertyName: string) {
    // Apply the standard @IsOptional() decorator
    IsOptional()(object, propertyName);

    console.log(object instanceof Cdr);
    // Add custom metadata for additional use cases
    Reflect.defineMetadata('isOptional', true, object, propertyName);
  };
};
