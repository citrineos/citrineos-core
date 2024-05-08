import {LocationReferences} from './LocationReferences';
import {Displaytext} from './Displaytext';
import {Token} from './Token';
import {AuthorizationInfoAllowed} from './AuthorizationInfoAllowed';
import {IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';

export class AuthorizationInfo {
  @IsEnum(AuthorizationInfoAllowed)
  allowed!: AuthorizationInfoAllowed;

  @IsNotEmpty()
  token!: Token;

  @IsString()
  authorizationReference!: string;

  @IsOptional()
  @Type(() => Displaytext)
  @ValidateNested()
  info?: Displaytext;

  @IsOptional()
  @Type(() => LocationReferences)
  @ValidateNested()
  location?: LocationReferences;
}
