import {LocationReferences} from './LocationReferences';
import {Displaytext} from './Displaytext';
import {Token} from './Token';
import {AuthorizationInfoAllowed} from './AuthorizationInfoAllowed';
import {IsEnum, IsNotEmpty, IsString, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {Optional} from "../util/optional";

export class AuthorizationInfo {
  @IsEnum(AuthorizationInfoAllowed)
  allowed!: AuthorizationInfoAllowed;

  @IsNotEmpty()
  token!: Token;

  @IsString()
  authorizationReference!: string;

  @Optional()
  @Type(() => Displaytext)
  @ValidateNested()
  info?: Displaytext;

  @Optional()
  @Type(() => LocationReferences)
  @ValidateNested()
  location?: LocationReferences;
}
