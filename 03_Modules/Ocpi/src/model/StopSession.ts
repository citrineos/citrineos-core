import {IsNotEmpty, IsString, MaxLength} from 'class-validator';
import {ResponseUrl} from "./ResponseUrl";

export class StopSession extends ResponseUrl {

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  session_id!: string;
}
