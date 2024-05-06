import { IsOptional, IsString } from 'class-validator';

export class AuthorizationHeaderSchema {
  @IsString()
  @IsOptional()
  Authorization?: string;
}
