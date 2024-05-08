import {IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, } from 'class-validator';
import {EvseStatus} from './EvseStatus';
import {Type} from 'class-transformer';

export class EvseStatusSchedule {
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  period_begin!: Date;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  @Type(() => Date)
  period_end!: Date | null;

  @IsEnum(EvseStatus)
  @IsNotEmpty()
  status!: EvseStatus;
}
