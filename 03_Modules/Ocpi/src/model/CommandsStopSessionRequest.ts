import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CommandsStopSessionRequest {
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  response_url!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  session_id!: string;
}
