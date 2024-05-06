import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class OcpiErrorResponse {
  @IsOptional()
  data?: null;

  @Max(4999)
  @Min(2000)
  @IsInt()
  @IsNotEmpty()
  status_code!: number;

  @IsOptional()
  status_message?: null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  timestamp!: Date;

  static build<T>(
      status_code: number,
  ): OcpiErrorResponse {
    const response = new OcpiErrorResponse();
    response.status_code = status_code;
    response.timestamp = new Date();
    return response;
  }
}
