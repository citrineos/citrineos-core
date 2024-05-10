import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ActiveChargingProfile } from './ActiveChargingProfile';
import { Type } from 'class-transformer';

export class ChargingprofilesActive {
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  start_date_time!: Date;

  @IsObject()
  @IsNotEmpty()
  @Type(() => ActiveChargingProfile)
  @ValidateNested()
  charging_profile!: ActiveChargingProfile;
}
