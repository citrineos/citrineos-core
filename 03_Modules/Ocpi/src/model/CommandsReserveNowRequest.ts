import {IsDateString, IsNotEmpty, IsObject, IsString, IsUrl, MaxLength, ValidateNested,} from 'class-validator';
import {Token} from './Token';
import {Type} from 'class-transformer';
import {Optional} from "../util/optional";

export class CommandsReserveNowRequest {
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  response_url!: string;

  @IsObject()
  @IsNotEmpty()
  @Type(() => Token)
  @ValidateNested()
  token!: Token;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  expiry_date!: Date;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  reservation_id!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  location_id!: string;

  @MaxLength(36)
  @IsString()
  @Optional()
  evse_uid?: string | null;

  @MaxLength(36)
  @IsString()
  @Optional()
  authorization_reference?: string | null;
}
