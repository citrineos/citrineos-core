import { IsDivisibleBy, IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class ChargingProfilePeriod {
  @IsInt()
  @IsNotEmpty()
  start_period!: number;

  @IsDivisibleBy(0.1)
  @IsNumber()
  @IsNotEmpty()
  limit!: number;
}
