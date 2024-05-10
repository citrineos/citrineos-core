import {
  IsNotEmpty,
  IsObject,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ChargingProfile } from './ChargingProfile';
import { Type } from 'class-transformer';

export class SetChargingProfile {
  @IsObject()
  @IsNotEmpty()
  @Type(() => ChargingProfile)
  @ValidateNested()
  charging_profile!: ChargingProfile;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  response_url!: string;
}
