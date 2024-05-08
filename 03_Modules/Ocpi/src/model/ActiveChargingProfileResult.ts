import {IsEnum, IsNotEmpty, IsOptional, ValidateNested} from 'class-validator';
import {ActiveChargingProfile} from './ActiveChargingProfile';
import {ChargingProfileResultType} from './ChargingProfileResponse';
import {Type} from 'class-transformer';

export class ActiveChargingProfileResult {
  @IsEnum(ChargingProfileResultType)
  @IsNotEmpty()
  result!: ChargingProfileResultType;

  @IsOptional()
  @Type(() => ActiveChargingProfile)
  @ValidateNested()
  profile?: ActiveChargingProfile | null;
}
