import {IsEnum, IsNotEmpty, ValidateNested} from 'class-validator';
import {ActiveChargingProfile} from './ActiveChargingProfile';
import {ChargingProfileResultType} from './ChargingProfileResponse';
import {Type} from 'class-transformer';
import {Optional} from "../util/optional";

export class ActiveChargingProfileResult {
  @IsEnum(ChargingProfileResultType)
  @IsNotEmpty()
  result!: ChargingProfileResultType;

  @Optional()
  @Type(() => ActiveChargingProfile)
  @ValidateNested()
  profile?: ActiveChargingProfile | null;
}
