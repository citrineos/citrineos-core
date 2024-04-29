import { IsNotEmpty, IsString } from 'class-validator';

export class ChargingprofilesClearProfileResult {
  @IsString()
  @IsNotEmpty()
  result!: string;
}
