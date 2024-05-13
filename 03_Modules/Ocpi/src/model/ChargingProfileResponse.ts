import { IsInt, IsNotEmpty } from 'class-validator';
import { Enum } from '../util/decorators/enum';

export enum ChargingProfileResultType {
  ACCEPTED = 'ACCEPTED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  REJECTED = 'REJECTED',
  TOO_OFTEN = 'TOO_OFTEN',
  UNKNOWN_SESSION = 'UNKNOWN_SESSION',
}

export class ChargingProfileResponse {
  @Enum(ChargingProfileResultType, 'ChargingProfileResultType')
  @IsNotEmpty()
  result!: ChargingProfileResultType;

  @IsInt()
  timeout!: number;
}
