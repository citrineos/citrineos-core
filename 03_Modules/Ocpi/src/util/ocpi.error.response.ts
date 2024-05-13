import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Optional } from './decorators/optional';

export class OcpiErrorResponse {
  @Optional()
  @ValidateNested() // needed for json schema
  data?: null;

  @Max(4999)
  @Min(2000)
  @IsInt()
  @IsNotEmpty()
  status_code!: number;

  @Optional()
  status_message?: string;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  timestamp!: Date;
}

export const buildOcpiErrorResponse = (
  status_code: number,
  status_message?: string,
) => {
  const response = new OcpiErrorResponse();
  response.status_code = status_code;
  response.status_message = status_message;
  response.timestamp = new Date();
  return response;
};
