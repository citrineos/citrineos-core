import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class Ocpierrorresponse {
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
}
