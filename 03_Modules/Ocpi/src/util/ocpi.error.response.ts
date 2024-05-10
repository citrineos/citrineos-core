import {IsDateString, IsInt, IsNotEmpty, IsString, Max, Min, ValidateNested,} from 'class-validator';
import {Optional} from "./optional";

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
  status_message?: null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  timestamp!: Date;

  static build(status_code: number): OcpiErrorResponse {
    const response = new OcpiErrorResponse();
    response.status_code = status_code;
    response.timestamp = new Date();
    return response;
  }
}
