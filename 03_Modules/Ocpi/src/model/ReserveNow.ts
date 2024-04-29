import { Token } from './Token';
import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class ReserveNow {
  @IsString()
  @IsNotEmpty()
  response_url!: string;

  @IsNotEmpty()
  token!: Token;

  @IsNotEmpty()
  @IsISO8601()
  expiry_date!: Date;

  @IsString()
  @IsNotEmpty()
  reservation_id!: string;

  @IsString()
  @IsNotEmpty()
  location_id!: string;

  @IsString()
  @IsNotEmpty()
  evse_uid!: string;

  @IsString()
  @IsNotEmpty()
  authorization_reference!: string;
}
