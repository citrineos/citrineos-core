import {IsNotEmpty, IsObject, IsString, MaxLength, ValidateNested,} from 'class-validator';
import {Token} from './Token';
import {Type} from 'class-transformer';
import {Optional} from '../util/decorators/optional';
import {ResponseUrl} from "./ResponseUrl";

export class StartSession extends ResponseUrl {

  @IsObject()
  @IsNotEmpty()
  @Type(() => Token)
  @ValidateNested()
  token!: Token;

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
  connector_id?: string | null;

  @MaxLength(36)
  @IsString()
  @Optional()
  authorization_reference?: string | null;
}
