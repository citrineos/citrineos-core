import { IsNotEmpty, ValidateNested } from 'class-validator';
import { ActiveChargingProfile } from './ActiveChargingProfile';
import { ChargingProfileResultType } from './ChargingProfileResponse';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';
import { Enum } from '../util/decorators/enum';

export class ActiveChargingProfileResult {
  @Enum(ChargingProfileResultType, 'ChargingProfileResultType')
  @IsNotEmpty()
  result!: ChargingProfileResultType;

  @Optional()
  @Type(() => ActiveChargingProfile)
  @ValidateNested()
  profile?: ActiveChargingProfile | null;
}
