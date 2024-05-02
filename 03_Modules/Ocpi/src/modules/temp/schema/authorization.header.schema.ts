import { IsNotEmpty, IsString } from 'class-validator';

export class AuthorizationHeader {
  @IsNotEmpty()
  @IsString()
  Authorization!: string;
}
