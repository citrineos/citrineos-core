import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ChargingProfile } from './ChargingProfile';
import { Type } from 'class-transformer';

export class ActiveChargingProfile {
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  start_date_time!: Date;

  @IsObject()
  @IsNotEmpty()
  @Type(() => ChargingProfile)
  @ValidateNested()
  charging_profile!: ChargingProfile;
}
