import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Token } from './Token';

export class CommandsStartSessionRequest {
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  response_url!: string;

  @IsObject()
  @IsNotEmpty()
  token!: Token;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  location_id!: string;

  @MaxLength(36)
  @IsString()
  @IsOptional()
  evse_uid?: string | null;

  @MaxLength(36)
  @IsString()
  @IsOptional()
  connector_id?: string | null;

  @MaxLength(36)
  @IsString()
  @IsOptional()
  authorization_reference?: string | null;
}
