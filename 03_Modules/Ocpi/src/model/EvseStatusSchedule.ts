import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EvseStatus } from './EvseStatus';

export class EvseStatusSchedule {
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  period_begin!: Date;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  period_end!: Date | null;

  @IsEnum(EvseStatus)
  @IsNotEmpty()
  status!: EvseStatus;
}
