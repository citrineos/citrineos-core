import {IsDateString, IsEnum, IsNotEmpty, IsString,} from 'class-validator';
import {EvseStatus} from './EvseStatus';
import {Type} from 'class-transformer';
import {Optional} from "../util/optional";

export class EvseStatusSchedule {
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  period_begin!: Date;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Optional()
  @Type(() => Date)
  period_end!: Date | null;

  @IsEnum(EvseStatus)
  @IsNotEmpty()
  status!: EvseStatus;
}
