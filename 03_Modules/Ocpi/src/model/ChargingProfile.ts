import {
  IsArray,
  IsDateString,
  IsDivisibleBy,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ChargingProfilePeriod } from './ChargingProfilePeriod';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';

export class ChargingProfile {
  @IsString()
  @IsDateString()
  @Optional()
  start_date_time?: Date | null;

  @IsInt()
  @Optional()
  duration?: number | null;

  @IsString()
  @IsNotEmpty()
  charging_rate_unit!: string;

  @IsDivisibleBy(0.1)
  @IsNumber()
  @Optional()
  min_charging_rate?: number | null;

  @IsArray()
  @Optional()
  @Type(() => ChargingProfilePeriod)
  @ValidateNested({ each: true })
  charging_profile_period?: ChargingProfilePeriod[] | null;
}
