import {IsNotEmpty, IsString} from 'class-validator';

export class ClearChargingProfileResult {
  @IsString()
  @IsNotEmpty()
  result!: string;
}
