import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ExceptionalPeriod {
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  period_begin!: Date;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  period_end!: Date;
}
