import {IsNotEmpty, IsString, MaxLength} from 'class-validator';
import {ResponseUrl} from "./ResponseUrl";

export class UnlockConnector extends ResponseUrl {

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  location_id!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  evse_uid!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  connector_id!: string;
}
