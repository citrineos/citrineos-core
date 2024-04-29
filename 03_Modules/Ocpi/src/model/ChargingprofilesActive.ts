import { IsDateString, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ActiveChargingProfile } from './ActiveChargingProfile';

export class ChargingprofilesActive {
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  start_date_time!: Date;

  @IsObject()
  @IsNotEmpty()
  charging_profile!: ActiveChargingProfile;
}
