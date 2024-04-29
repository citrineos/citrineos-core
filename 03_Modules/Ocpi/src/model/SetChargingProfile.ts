import { IsNotEmpty, IsObject, IsString, IsUrl } from 'class-validator';
import { ChargingProfile } from './ChargingProfile';

export class SetChargingProfile {
  @IsObject()
  @IsNotEmpty()
  charging_profile!: ChargingProfile;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  response_url!: string;
}
