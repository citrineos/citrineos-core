import {IsOptional, IsString} from 'class-validator';

export class AuthorizationHeader {
  @IsString()
  @IsOptional()
  Authorization?: string;
}
