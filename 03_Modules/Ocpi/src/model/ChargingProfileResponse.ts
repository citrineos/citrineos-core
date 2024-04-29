import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

export enum ChargingProfileResultType {
  ACCEPTED = 'ACCEPTED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  REJECTED = 'REJECTED',
  TOO_OFTEN = 'TOO_OFTEN',
  UNKNOWN_SESSION = 'UNKNOWN_SESSION',
}

export class ChargingProfileResponse {
  @IsEnum(ChargingProfileResultType)
  @IsNotEmpty()
  result!: ChargingProfileResultType;

  @IsInt()
  timeout!: number;
}
